import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { execaCommand as execa } from "execa";
import { isWin } from "./constant";

const pythonExecutePath = join(
  fileURLToPath(import.meta.url),
  "../../src/lib/dialog.py"
);
const pythonCmdName = isWin ? "python" : "python3";

export const showOpenDialog = async (type: "file" | "files" | "directory") => {
  const { stdout } = await execa(
    `${pythonCmdName} ${pythonExecutePath} --type=${type}`
  );
  return stdout;
};

export const showSaveDialog = async () => {
  const { stdout } = await execa(
    `${pythonCmdName} ${pythonExecutePath} --type=save`
  );
  return stdout;
};
