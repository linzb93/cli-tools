import express, { Router } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { join } from 'node:path';
import config from '../../../../config.json';
import bug from './controllers/bug';
import setting from './controllers/setting';
import agent, { agentCallback } from './controllers/agent';
import sql from '../utils/sql';

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const router = Router();

router.use('/bug', bug);
router.use('/setting', setting);
router.use('/agent', agent);
app.use('/api', router);
agentCallback(app);

// 为所有 Vue 项目设置静态资源访问路径
(async () => {
    const vueProjects = await sql((db) => db.vue);
    const validProjects = vueProjects.filter((project) => project.publicPath && project.publicPath.trim() !== '');

    for (const project of validProjects) {
        const staticPath = join(project.path, 'dist');
        app.use(project.publicPath, express.static(staticPath));
        console.log(`vue静态资源已挂载: ${project.publicPath} -> ${staticPath}`);
    }
})();

app.listen(config.port.production, () => {
    process.send?.('server-start');
});
