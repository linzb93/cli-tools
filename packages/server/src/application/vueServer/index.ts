import express from "express";
import { join } from "node:path";
import { execaCommand as execa } from "execa";
const app = express();

const port = getCommandArgValue("port");
const cwd = getCommandArgValue("cwd") as string;
(async () => {
  await execa("npm run build", {
    cwd,
  });
  const vueConfig = await import(join(cwd, "vue.config.js"));
  const { publicPath } = vueConfig;
  app.use(publicPath, express.static(join(cwd, "dist")));

  app.listen(port, () => {
    process.send?.("ok");
  });
})();

function getCommandArgValue(key: string) {
  const args = process.argv.slice(2);
  const match = args.find((arg) => arg.startsWith(`--${key}`));
  if (match) {
    const replaced = match.replace(`--${key}`, "");
    if (replaced === "") {
      return true;
    }
    if (!isNaN(Number(replaced))) {
      return Number(replaced);
    }
    if (replaced === "true") {
      return true;
    }
    if (replaced === "false") {
      return false;
    }
    return replaced;
  }
  return "";
}
