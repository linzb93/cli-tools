import { fileURLToPath } from 'node:url';
import express, { Router } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { join } from 'node:path';
import config from '../../../../config.json';
import bug, { bugCallback } from './controllers/bug';
import common from './controllers/common';
import setting from './controllers/setting';
import { run } from './shared/log';
import agent, { agentCallback } from './controllers/agent';
import { mountVueProjects } from './controllers/vue';

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const router = Router();
app.use(`/${config.prefix.static}`, express.static(join(fileURLToPath(import.meta.url), `../${config.prefix.static}`)));
router.use('/bug', bug);
router.use('/setting', setting);
router.use('/agent', agent);
router.use('/common', common);

app.use('/api', router);
agentCallback(app);

// 为所有 Vue 项目设置静态资源访问路径
(async () => {
    await Promise.all([mountVueProjects(app), bugCallback()]);
    app.listen(config.port.production, 'localhost', () => {
        run();
        process.send?.({
            type: 'server-start',
        });
    });
})();
