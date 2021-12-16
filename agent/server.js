const { Command } = require('commander');
const program = new Command();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const getPort = require('detect-port');
program
    .option('--proxy <url>', '代理地址')
    .option('--port <num>', '端口号')
    .option('--debug', '调试阶段')
    .allowUnknownOption()
    .action(async options => {
        const app = express();
        app.use(express.urlencoded({ extended: false }));
        app.use(express.json());
        app.use(cors());
        app.all('/proxy/*', (req, res) => {
            const url = req.url.replace('/proxy', '');
            /**
             * 下载静态资源用
             * sourceRes.data.pipe(expressRes);
             */
            const payload = req.method === 'get' ? { params: req.params } : { data: req.body };
            axios({
                method: req.method,
                url: `${options.proxy}${url}`,
                ...payload,
                headers: req.headers
            })
                .then(resp => {
                    res.send(resp.data);
                })
                .catch(e => {
                    const status = e.response ? e.response.status : 500;
                    res.status(status).send(e.response || {
                        message: e.message
                    });
                });
        });
        const port = await getPort(options.port || 8080);
        app.listen(port, () => {
            !options.debug && process.send({ port });
        });
    });
program.parse();
