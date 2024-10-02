<script>
    import { onMount } from 'svelte';
    import * as XLSX from 'xlsx';
    import { createReloadChannel } from '$lib/reloadChannel';
    
    let sourceTable = [];
    let targetTable = [
        { id: 1, red: null, blue: null },
        { id: 2, red: null, blue: null },
        { id: 3, red: null, blue: null }
    ];
    let importedData = [];
    
    let stateHistory = [];
    
    let reloadChannel;
    let title = "Nástěnka";
    
    onMount(async () => {
        console.log("Edit page: onMount");
        reloadChannel = createReloadChannel();
        await fetchDataFromApi();
    });
    
    function isRowComplete(row) {
        return row.red !== null && row.blue !== null;
    }
    
    function reloadHomePage() {
        console.log('Edit page: Reload button pressed');
        if (reloadChannel) {
            console.log('Edit page: Sending reload message');
            reloadChannel.postMessage('reload');
        } else {
            console.error('Edit page: Reload channel not available');
        }
    }
    
    async function fetchDataFromApi() {
        try {
            const response = await fetch('/api', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
    
            if (response.ok) {
                const data = await response.json();
                title = data.title || title;
                sourceTable = data.sourceTable.map(row => ({
                    id: row.id,
                    red: row.red ? { name: row.red, team: row.redTeam, number: row.redNumber } : null,
                    blue: row.blue ? { name: row.blue, team: row.blueTeam, number: row.blueNumber } : null,
                    category: row.category,
                    number: row.number
                })) || [];
                console.log(data.targetTable);
                if (data.targetTable.length === 0) {
                    targetTable = [
                        { id: 1, red: null, blue: null },
                        { id: 2, red: null, blue: null },
                        { id: 3, red: null, blue: null }
                    ];
                } else {
                    targetTable = data.targetTable;
                }
    
                importedData = data.importedData || [];
                console.log('Data fetched successfully');
                console.log('targetTable:', targetTable);
    
            } else {
                console.error('Failed to fetch data');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }
    
    function saveState() {
        stateHistory.push({
            sourceTable: JSON.parse(JSON.stringify(sourceTable)),
            targetTable: JSON.parse(JSON.stringify(targetTable)),
            importedData: JSON.parse(JSON.stringify(importedData))
        });
    }
    
    function undoLastAction() {
        if (stateHistory.length > 0) {
            const previousState = stateHistory.pop();
            sourceTable = previousState.sourceTable;
            targetTable = previousState.targetTable;
            importedData = previousState.importedData;
        }
    }
    
    function handleFileSelect(event) {
        const file = event.target.files[0];
        const reader = new FileReader();
    
        reader.onload = function(e) {
            let data = parseExcel(e.target.result);
            importedData = data.slice(1).map((item, index) => ({...item, id: index})); // Skip header row and add id
            saveState(); // Save state after importing data
        };
    
        reader.readAsArrayBuffer(file);
    }
    
    function parseExcel(data) {
        const workbook = XLSX.read(data, {type: 'array'});
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        let jsonData = XLSX.utils.sheet_to_json(worksheet, {header: ['Jméno', 'Příjmení', 'Tým', 'Číslo']});
        
        // Sort the data by 'Číslo'
        jsonData.sort((a, b) => {
            const numA = parseInt(a.Číslo);
            const numB = parseInt(b.Číslo);
            return numA - numB;
        });
        
        return jsonData;
    }
    
    function handleDragStart(event, item, type) {
        event.dataTransfer.setData("application/json", JSON.stringify({item, type}));
    }
    
    function handleDropOnSourceTable(event, rowIndex, nameField) {
        event.preventDefault();
        const data = JSON.parse(event.dataTransfer.getData("application/json"));
        if (data.type === 'person') {
            saveState(); // Save state before modifying
            sourceTable = sourceTable.map((row, index) => 
                index === rowIndex 
                    ? {...row, [nameField]: {
                        name: `${data.item.Jméno} ${data.item.Příjmení}`,
                        team: data.item.Tým,
                        number: data.item.Číslo
                      }} 
                    : row
            );
            importedData = importedData.filter(p => p.id !== data.item.id);
        }
    }
    
    function handleDropOnTargetTable(event, rowIndex) {
        event.preventDefault();
        const data = JSON.parse(event.dataTransfer.getData("application/json"));
        if (data.type === 'row' && data.item.red && data.item.blue) {
            saveState(); // Save state before modifying
    
            // Store the current data in the target cell, if any
            const currentRed = targetTable[rowIndex].red;
            const currentBlue = targetTable[rowIndex].blue;
    
            // Update the target table
            targetTable = targetTable.map((row, index) => 
                index === rowIndex 
                    ? {...row, red: data.item.red, blue: data.item.blue, content: `${data.item.category} ${data.item.number}`} 
                    : row
            );
    
            // Remove the row from the source table
            sourceTable = sourceTable.filter(row => row.id !== data.item.id);
    
            // Add the displaced data back to importedData if they exist
            if (currentRed) {
                importedData = [...importedData, {
                    id: Date.now(),
                    Jméno: currentRed.name.split(' ')[0],
                    Příjmení: currentRed.name.split(' ')[2],
                    Tým: currentRed.team,
                    Číslo: currentRed.number
                }];
            }
            if (currentBlue) {
                console.log(currentBlue);
                console.log(currentBlue.name.split(' '));
                importedData = [...importedData, {
                    id: Date.now() + 1,
                    Jméno: currentBlue.name.split(' ')[0],
                    Příjmení: currentBlue.name.split(' ')[2],
                    Tým: currentBlue.team,
                    Číslo: currentBlue.number
                }];
            }
        }
    }
    
    function allowDrop(event) {
        event.preventDefault();
    }
    
    function handleDragStartRow(event, row) {
        if (isRowComplete(row)) {
            handleDragStart(event, row, 'row');
        } else {
            event.preventDefault();
        }
    }
    
    function addRow() {
        saveState(); // Save state before adding a row
        const newId = sourceTable.length + 1;
        const newRow = { id: newId, red: null, blue: null, category: 'B příp', number: String(30 - newId) };
        sourceTable = [...sourceTable, newRow];
    }
    
    async function sendDataToApi() {
        const dataToSend = {
            title,
            sourceTable: sourceTable.map(row => ({
                id: row.id,
                category: row.category,
                number: row.number,
                red: row.red ? row.red.name : null,
                redTeam: row.red ? row.red.team : null,
                redNumber: row.red ? row.red.number : null,
                blue: row.blue ? row.blue.name : null,
                blueTeam: row.blue ? row.blue.team : null,
                blueNumber: row.blue ? row.blue.number : null
            })),
            targetTable,
            importedData
        };
    
        try {
            const response = await fetch('/api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend),
            });
    
            if (response.ok) {
                alert('Data úspěšně uloženy!');
            } else {
                alert('Odeslání dat se nezdařilo. Prosím zkuste to znovu.');
            }
        } catch (error) {
            console.error('Error sending data:', error);
            alert('Při odesílání dat došlo k chybě. Prosím zkuste to znovu.');
        }
    }
    
    async function deleteData() {
        try {
            const response = await fetch('/api', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
    
            if (response.ok) {
                alert('Data úspěšně smazány!');
                // Reset the tables and imported data
                sourceTable = [];
                targetTable = [
                    { id: 1, red: null, blue: null },
                    { id: 2, red: null, blue: null },
                    { id: 3, red: null, blue: null }
                ];
                importedData = [];
            } else {
                alert('Smazání dat se nezdařilo. Prosím zkuste to znovu.');
            }
        } catch (error) {
            console.error('Error deleting data:', error);
            alert('Při mazání dat došlo k chybě. Prosím zkuste to znovu.');
        }
    }
    </script>
    
    <main>
        <div class="header">
            <input 
                type="text" 
                bind:value={title} 
                class="title-input"
            />
        </div>
        <input type="file" accept=".xlsx" on:change={handleFileSelect}>
        <div class="button-container">
            <div class="button-group">
                <button on:click={reloadHomePage}>Obnovit zobrazení</button>
                <button on:click={sendDataToApi}>Uložit data</button>
                <button on:click={undoLastAction}>vrátit zpět</button>
            </div>
            <button class="delete-button" on:click={deleteData}>Smazat všechny data</button>
        </div>
        <div class="content">
            <div class="left-column">
                <table id="targetTable">
                    <tr>
                        <th>1</th>
                        <th>2</th>
                        <th>3</th>
                    </tr>
                    <tr>
                        {#each targetTable as cell}
                            <td 
                                class="droppable" 
                                on:drop={(e) => handleDropOnTargetTable(e, cell.id - 1)} 
                                on:dragover={allowDrop}
                            >
                                {cell.red ? cell.red.name : 'Položte '}
                                <br>
                                {cell.blue ? cell.blue.name : ' sem'}
                            </td>
                        {/each}
                    </tr>
                </table>
                <table id="sourceTable">
                    {#each sourceTable as row}
                        <tr class:complete={isRowComplete(row)}>
                            <td 
                                class="drag-handle" 
                                draggable={isRowComplete(row)} 
                                on:dragstart={(e) => handleDragStartRow(e, row)}
                            >
                                ☰
                            </td>
                            <td 
                                class="droppable" 
                                on:drop={(e) => handleDropOnSourceTable(e, row.id - 1, 'red')} 
                                on:dragover={allowDrop}
                            >
                                {row.red ? row.red.name : 'Položte sem (červený)'}
                            </td>
                            <td>{row.category}<br>{row.number}</td>
                            <td 
                                class="droppable" 
                                on:drop={(e) => handleDropOnSourceTable(e, row.id - 1, 'blue')} 
                                on:dragover={allowDrop}
                            >
                                {row.blue ? row.blue.name : 'Položte sem (Modrý)'}
                            </td>
                        </tr>
                    {/each}
                </table>
                <button on:click={addRow}>Přidat řadu</button>
            </div>
            <div class="right-column">
                {#each importedData as person}
                    <div 
                        class="draggable" 
                        draggable="true" 
                        on:dragstart={(e) => handleDragStart(e, person, 'person')}
                    >
                        {person.Jméno} {person.Příjmení} ({person.Tým}) - #{person.Číslo}
                    </div>
                {/each}
            </div>
        </div>
    </main>
    <style>
        .button-container {
             display: flex;
             justify-content: space-between;
             align-items: center;
             margin-bottom: 20px;
         }
     
         .button-group {
             display: flex;
         }
     
         .button-group button {
             margin-right: 10px;
         }
     
         .delete-button {
             margin-left: 20px;
             background-color: #ff4136;
         }
     
         .delete-button:hover {
             background-color: #ff1919;
         }
         :global(body) {
             font-family: Arial, sans-serif;
             margin: 0;
             padding: 20px;
             background-color: #f0f0f0;
     
         }
         main {
     
             margin: 0 auto;
             background-color: #fff;
             padding: 20px;
             border-radius: 5px;
             box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
         }
         .header {
             text-align: center;
             font-size: 24px;
             margin-bottom: 20px;
             color: #333;
         }
         .content {
             display: flex;
             justify-content: space-between;
         }
         .left-column {
             width: 70%;
         }
         .right-column {
             width: 25%;
             background-color: #fff;
             padding: 10px;
             border: 1px solid #ddd;
             max-height: 80vh;
             overflow-y: auto;
         }
         table {
             width: 100%;
             border-collapse: collapse;
             margin-bottom: 20px;
             background-color: #fff;
         }
         th, td {
             border: 1px solid black;
             padding: 10px;
             text-align: center;
         }
         th {
             background-color: lightgray;
         }
         .draggable {
             cursor: move;
             margin-bottom: 5px;
             padding: 5px;
             background-color: #f9f9f9;
             border: 1px solid #ddd;
         }
         .draggable:hover {
             background-color: #f0f0f0;
         }
         .droppable {
             background-color: #e0e0e0;
         }
         :global(input[type="file"]) {
             margin-bottom: 20px;
             display: block;
         }
         .title-input {
             text-align: center;
             font-size: 24px;
             margin-bottom: 20px;
             color: #333;
             width: 100%;
             border: none;
             background: transparent;
             font-weight: bold;
         }
     
         .title-input:focus {
             outline: none;
             border-bottom: 2px solid #4CAF50;
         }
         .drag-handle {
             cursor: move;
             user-select: none;
             padding: 5px;
             text-align: center;
             background-color: #f0f0f0;
         }
         .complete .drag-handle {
             background-color: #c8e6c9;
         }
         .complete .drag-handle:hover {
             background-color: #a5d6a7;
         }
         tr {
             user-select: none;
         }
         button {
             padding: 10px 20px;
             background-color: #4CAF50;
             color: white;
             border: none;
             cursor: pointer;
             font-size: 16px;
         }
         button:hover {
             background-color: #45a049;
         }
     </style>