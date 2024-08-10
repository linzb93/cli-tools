import { Command } from "commander";
import express from "express";
import fs from "fs-extra";
import cors from "cors";
import getPort from "detect-port";
import internalIp from "internal-ip";
import path from "node:path";
import * as helper from "@/util/helper";
import Mock from "mockjs";
const program = new Command();

interface YapiConfig {
  items: {
    path: string;
    json: {
      root: string;
    } | null;
  }[];
}

program
  .option("--prefix <prefix>", "地址")
  .option("--id <id>", "项目ID")
  .allowUnknownOption()
  .action(async (_, optArg) => {
    const options = optArg.opts ? optArg.opts() : optArg;
    const app = express();
    app.use(express.urlencoded({ extended: false }));
    app.use(express.json());
    app.use(cors());
    app.all(`${options.prefix}/*`, async (req, res) => {
      const map = (await fs.readJSON(
        path.resolve(helper.root, `data/yapi/${options.id}.json`)
      )) as YapiConfig;
      const url = req.url.replace(options.prefix, "");
      const match = map.items.find((item) => item.path === url);
      if (!match) {
        res.send({
          code: 404,
          data: null,
          msg: "接口不存在",
          result: null,
        });
        return;
      }
      res.send({
        code: 200,
        data: null,
        msg: "success",
        success: true,
        result: (() => {
          if (match.json === null) {
            return null;
          }
          if (match.json.root) {
            return Mock.mock(match.json).root;
          }
          if (Object.keys(match.json).find((key) => key.startsWith("root"))) {
            return Mock.mock(match.json).root;
          }
          return Mock.mock(match.json);
        })(),
      });
    });
    const [port, ip] = await Promise.all([
      getPort(options.port || 6500),
      internalIp.v4(),
    ]);
    app.listen(port, () => {
      process.send?.({ port, ip });
    });
  });
program.parse(process.argv);

process.on("unhandledRejection", async (err: Error) => {
  await fs.appendFile("debug.txt", err.message);
});
