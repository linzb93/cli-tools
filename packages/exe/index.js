import { execaCommand as execa } from "execa";
import pMap from "p-map";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import fs from "fs-extra";
const pythonDirs = join(fileURLToPath(import.meta.url), "../python");
const targetDir = resolve(pythonDirs, "../../server/dist/lib");
const dirs = await fs.readdir(pythonDirs);
await pMap(dirs, async (file) => {
  await execa(
    `pyinstaller --onefile ${pythonDirs}/${file} --distpath=${targetDir}`,
    {
      stdout: process.stdout,
    }
  );
});
