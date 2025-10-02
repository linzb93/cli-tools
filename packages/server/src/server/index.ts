import { fileURLToPath } from 'node:url';
import express, { Router } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { join } from 'node:path';
import config from '../../../../config.json';
import bug from './controllers/bug';
import common from './controllers/common';
import setting from './controllers/setting';
import { log, run } from './shared/log';
import agent, { agentCallback } from './controllers/agent';
import sql from '../utils/sql';

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
    const vueProjects = await sql((db) => db.vue);
    const validProjects = vueProjects.filter((project) => project.publicPath && project.publicPath.trim() !== '');
    for (let i = 0; i < validProjects.length; i++) {
        const project = validProjects[i];
        const staticPath = join(project.path, 'dist');
        log(`vue静态资源已挂载: ${project.publicPath} -> ${staticPath}`);
        app.use(project.publicPath, express.static(staticPath));
    }
})();

app.listen(config.port.production, () => {
    run();
    process.send?.({
        type: 'server-start',
    });
});
