// src/routes/api/+server.js
import { json } from "@sveltejs/kit";
import fs from "fs/promises";
import path from "path";

const dataFilePath = path.join(process.cwd(), "data.json");

export async function POST({ request }) {
  try {
    const data = await request.json();
    // Process the data as before
    const processedData = {
      title: data.title,
      sourceTable: data.sourceTable.map((row) => ({
        id: row.id,
        category: row.category,
        number: row.number,
        red: row.red,
        blue: row.blue,
      })),
      targetTable: data.targetTable,
      importedData: data.importedData,
    };

    // Save the processed data to a JSON file
    await fs.writeFile(dataFilePath, JSON.stringify(processedData, null, 2));

    return json(
      {
        success: true,
        message: "Data received, processed, and saved successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing or saving data:", error);
    return json(
      { success: false, message: "Error processing or saving data" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Check if the file exists
    try {
      await fs.access(dataFilePath);
    } catch {
      // If the file doesn't exist, return an empty object
      return json({ sourceTable: [], targetTable: [], importedData: [] });
    }

    // Read the data from the JSON file
    const fileContent = await fs.readFile(dataFilePath, "utf-8");
    const data = JSON.parse(fileContent);

    return json(data);
  } catch (error) {
    console.error("Error reading data:", error);
    return json({ error: "Error reading data" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    // Check if the file exists
    try {
      await fs.access(dataFilePath);
    } catch {
      // If the file doesn't exist, return a message
      return json({ message: "No data to delete" }, { status: 404 });
    }

    // Delete the file
    await fs.unlink(dataFilePath);

    return json(
      { success: true, message: "Data deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting data:", error);
    return json(
      { success: false, message: "Error deleting data" },
      { status: 500 }
    );
  }
}
