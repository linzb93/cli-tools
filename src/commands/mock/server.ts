import { Command } from 'commander';
import express from 'express';
import fs from 'fs-extra';
import cors from 'cors';
import getPort from 'detect-port';
import internalIp from 'internal-ip';
import path from 'path';
import * as helper from '../../util/helper.js';
import Mock from 'mockjs';
const program = new Command();

program
  .option('--prefix <prefix>', '地址')
  .option('--id <id>', '项目ID')
  .allowUnknownOption()
  .action(async (_, optArg) => {
    const options = optArg.opts ? optArg.opts() : optArg;
    const app = express();
    app.use(express.urlencoded({ extended: false }));
    app.use(express.json());
    app.use(cors());
    app.all(`${options.prefix}/*`, async (req, res) => {
      const map = await fs.readJSON(
        path.resolve(helper.root, `data/yapi/${options.id}.json`)
      );
      const url = req.url.replace(options.prefix, '');
      const match = map.items.find((item: any) => item.path === url);
      if (!match) {
        res.send({
          code: 404,
          data: null,
          msg: '接口不存在',
          result: null
        });
        return;
      }
      if (!match.json.msg) {
        // 忘记包裹了
        res.send({
          code: 404,
          data: null,
          msg: '接口不存在',
          result: Mock.mock(match.json)
        });
        return;
      }
      res.send(Mock.mock(match.json));
    });
    const [port, ip] = await Promise.all([
      getPort(options.port || 8080),
      internalIp.v4()
    ]);
    app.listen(port, () => {
      process.send?.({ port, ip, info: options.prefix });
    });
  });
program.parse(process.argv);
