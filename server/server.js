const { Command } = require('commander');
const program = new Command();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
const getPort = require('detect-port');

program
    .option('--proxy <url>', '代理地址')
    .option('--port <num>', '端口号')
    .allowUnknownOption()
    .action(async options => {
        const app = express();
        app.use(bodyParser.urlencoded({ extended: false }));
        app.use(bodyParser.json());
        app.use(cors());
        app.all('/proxy/*', (req, res) => {
            const url = req.url.replace('/proxy', '');
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
            process.send({ port });
        });
    });
program.parse();
