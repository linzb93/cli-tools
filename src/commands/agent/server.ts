import { Command } from 'commander';
import express from 'express';
import chalk from 'chalk';
import clipboard from 'clipboardy';
import axios, { AxiosRequestHeaders, Method } from 'axios';
import cors from 'cors';
import getPort from 'detect-port';
import internalIp from 'internal-ip';
const program = new Command();

program
  .option('--proxy <url>', '代理地址')
  .option('--port <num>', '端口号')
  .option('-c, --copy', '复制网络地址')
  .option('--debug', '调试阶段')
  .allowUnknownOption()
  .action(async (_, optArg) => {
    const options = optArg.opts ? optArg.opts() : optArg;
    const app = express();
    app.use(express.urlencoded({ extended: false }));
    app.use(express.json());
    app.use(cors());
    app.all('/proxy/*', (req, res) => {
      const url = req.url.replace('/proxy', '');
      if (url.split('/').slice(-1)[0].includes('.')) {
        // 处理静态资源
        axios({
          url: `${options.proxy}${url}`,
          headers: req.headers as AxiosRequestHeaders,
          responseType: 'stream'
        }).then((sourceRes) => {
          sourceRes.data.pipe(res);
        });
        return;
      }
      const payload =
        req.method === 'get' ? { params: req.params } : { data: req.body };
      axios({
        method: req.method as Method,
        url: `${options.proxy}${url}`,
        ...payload,
        headers: req.headers as AxiosRequestHeaders
      })
        .then((resp) => {
          res.send(resp.data);
        })
        .catch((e) => {
          const status = e.response ? e.response.status : 500;
          res.status(status).send(
            e.response || {
              message: e.message
            }
          );
        });
    });
    const [port, ip] = await Promise.all([
      getPort(options.port || 8080),
      internalIp.v4()
    ]);
    app.listen(port, () => {
      if (options.copy) {
        clipboard.writeSync(`http://${ip}:${port}/proxy`);
      }
      if (!options.debug) {
        (process.send as Function)({ port, ip });
      } else {
        console.log(`
代理服务器已在 ${chalk.yellow(port)} 端口启动：
- 本地：${chalk.magenta(`http://localhost:${port}/proxy`)}
- 网络：${chalk.magenta(`http://${ip}:${port}/proxy`)}
路由映射至：${chalk.cyan(options.proxy)}`);
      }
    });
  });
program.parse(process.argv);
