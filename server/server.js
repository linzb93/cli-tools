const { Command } = require('commander');
const program = new Command();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
const logger = require('../lib/logger');
const getPort = require('detect-port');
const os = require('os');
const chalk = require('chalk');
const clipboard = require('clipboardy');
const options = {
    proxy: 'http://192.168.0.69:8005/meituan',
    port: 5000
};
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.all('/proxy/*', (req, res) => {
    const url = req.url.replace('/proxy', '');
    axios({
        method: req.method,
        url: `${options.proxy}${url}`,
        data: req.body,
        headers: {
            token: req.headers.token
        }
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
// const port = await getPort(options.port || 8080);
const port = 5000;
const ip = os.networkInterfaces()['以太网'][1].address;
// app.listen(port);
console.log({ port, ip });
