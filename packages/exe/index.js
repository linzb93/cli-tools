import { execaCommand as execa } from "execa";
import pMap from "p-map";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import fs from "fs-extra";
const pythonDirs = join(fileURLToPath(import.meta.url), "../python");
const targetDir = resolve(pythonDirs, "../../server/dist/lib");
const dirs = await fs.readdir(pythonDirs);
await pMap(dirs, async (file) => {
  const execName = file.replace(/\.py$/, "");
  await execa(
    `pyinstaller --onefile ${pythonDirs}/${file} --distpath=${targetDir}`
  );
  // 移除无用的产物
  await fs.remove(`build/${execName}`);
  await fs.unlink(`${execName}.spec`);
});
