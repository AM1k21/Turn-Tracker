<script>
    import { onMount } from 'svelte';
    import { createReloadChannel } from '$lib/reloadChannel';
    let title = "Nástěnka";



    let reloadChannel;
    let loadedData = null;

    onMount(async () => {
        console.log("Root page: onMount");
        reloadChannel = createReloadChannel();

        if (reloadChannel) {
            console.log('Root page: reloadChannel created');
            reloadChannel.onmessage = (event) => {
                console.log('Root page: message received:', event.data);
                if (event.data === 'reload') {
                    console.log('Root page: Reloading...');
                    window.location.reload();
                }
            };
        } else {
            console.log('Root page: reloadChannel is null');
        }

        try {
            const response = await fetch('/api');
            if (response.ok) {
                loadedData = await response.json();
                console.log('Loaded data:', loadedData);
                title = loadedData.title;
                updateUI(loadedData);
            } else {
                console.error('Failed to load data');
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }

        return () => {
            console.log("Root page: cleanup");
            if (reloadChannel) {
                reloadChannel.close();
            }
        };
    });

    function updateUI(data) {
        if (data && data.targetTable && data.sourceTable) {
            updateTable('table:first-of-type tbody', data.targetTable, formatTargetTable);
            updateTable('table:last-of-type tbody', data.sourceTable, formatSourceTable);
        }
    }

    function updateTable(selector, data, formatter) {
        const tableBody = document.querySelector(selector);
        if (tableBody) {
            tableBody.innerHTML = formatter(data);
        }
    }

    function formatTargetTable(data) {
        if (data.length >= 3) {
            return `
                <tr>
                    <td  style="background-color: lightcoral;padding : 14px; text-align:center; border: 1px solid black">${data[0].redName}  </td>
                    <td  style="background-color: lightcoral;padding : 14px; text-align:center; border: 1px solid black">${data[1].redName}  </td>
                    <td  style="background-color: lightcoral;padding : 14px; text-align:center; border: 1px solid black">${data[2].redName}  </td>
                </tr>
                <tr>
                    <td style="background-color: lightblue;padding : 14px; text-align:center; border: 1px solid black">${data[0].blueName}  </td>
                    <td style="background-color: lightblue;padding : 14px; text-align:center; border: 1px solid black">${data[1].blueName}  </td>
                    <td style="background-color: lightblue;padding : 14px; text-align:center; border: 1px solid black">${data[2].blueName}  </td>
                </tr>
            `;
        }
        return '';
    }

    function formatSourceTable(data) {
        return data.map(row => `
            <tr>
                <td style="border: 1px solid black; text-align: center ; background-color: lightcoral;padding : 10px;    ">${row.red || 'Drop name here (Red)'}</td>
               
                <td style="border: 1px solid black;padding : 10px; text-align: center; background-color: lightblue">${row.blue || 'Drop name here (Blue)'}</td>
            </tr>
        `).join('');
    }
</script>

<main>
    <body>
        
    <div class="header"  >   <p>{title}</p>
          </div>

    <table class="responsive-table">
        <thead>
            <tr>
                <th>1</th>
                <th>2</th>
                <th>3</th>
            </tr>
        </thead>
        <tbody>
            <tr >
                <td  style="text-align: center; padding: 10px">Daneil Pěch, Karel Jakuvek (B příp 26)</td>
                <td class="TEXTALIGN">Jarek Brecht, Daneil Pěch (B příp 27)</td>
                <td class="TEXTALIGN">Adam Mikul, Petr Vogol (B příp 24)</td>
            </tr>
        </tbody>
    </table>

    <table class="responsive-table">
        <tbody>
            <tr>
                <td>Karel Jakuvek</td>
                <td>
                    <p>B příp</p>
                    <p>29</p>
                </td>
                <td>Adam Mikul</td>
            </tr>
            <tr>
                <td>Petr Vogol</td>
                <td>
                    <p>B příp</p>
                    <p>25</p>
                </td>
                <td>Jarek Brecht</td>
            </tr>
            <tr>
                <td>Adam Mikul</td>
                <td>
                    <p>B příp</p>
                    <p>24</p>
                </td>
                <td>Daneil Pěch</td>
            </tr>
        </tbody>
    </table>
</body>

</main>
<style>
    main   {align-items: center;
        min-width: 800px;
        margin: 0 auto;
        padding: 20px;
        align-self: center;

    }
    body {
        background-color: #ffffff;

        min-width: 1000px;
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        align-self: center;
    }
    .header {
        text-align: center;
        font-size: 24px;
        margin: 20px 0;
        color: #333;
    }
    .responsive-table {
        width: 90%;
        margin-bottom: 20px;
        background-color: #fff;
        border-collapse: collapse;
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
        border-radius: 8px;
        overflow: hidden;
    }
    .responsive-table th,
    .responsive-table td {
        border: 1px solid black;
        padding: 12px;
        text-align: center;
        font-size: 18px;
        text-align: center;

    }
    .responsive-table th {
        background-color: lightgray;
    }
    .responsive-table tbody tr:nth-child(even) {
        background-color: #f2f2f2;
    }

    
    @media(max-width: 768px) {
        .responsive-table {
            width: 100%;
        }
        .responsive-table th,
        .responsive-table td {
            display: block;
            width: 100%;
            box-sizing: border-box;
            padding: 10px;
            font-size: 16px;
            text-align: center;
        }
        .responsive-table th {
            display: none;
        }
        .responsive-table tbody tr {
            display: flex;
            flex-direction: column;
            border: 1px solid black;
            margin-bottom: 10px;
            border-radius: 8px;
            overflow: hidden;
        }
        .responsive-table td {
            border: none;
            text-align: left;
            padding-left: 10px;
            position: relative;
        }
        .responsive-table td::before {
            content: attr(data-label);
            position: absolute;
            left: 10px;
            top: 50%;
            transform: translateY(-50%);
            width: 30%;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    }
</style>