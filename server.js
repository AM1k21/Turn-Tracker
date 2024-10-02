import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function startSvelteKit() {
  const svelteKitProcess = spawn("npm", ["run dev"], {
    cwd: __dirname,
    shell: true,
    stdio: "inherit",
  });

  svelteKitProcess.on("error", (error) => {
    console.error(`Failed to start SvelteKit server: ${error}`);
  });

  svelteKitProcess.on("close", (code) => {
    console.log(`SvelteKit server process exited with code ${code}`);
  });

  return svelteKitProcess;
}

const server = startSvelteKit();

process.on("SIGINT", () => {
  server.kill("SIGINT");
  process.exit();
});
