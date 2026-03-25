import { join, dirname } from 'node:path';
// import { log } from '../shared/log';
import { sql } from '@cli-tools/shared';
import express, { type Application, Router } from 'express';
import { startStaticServer } from '../../../cli/src/business/vue/staticServer'; // Fixed path

export const vueRouter = Router();

vueRouter.post('/start', async (req, res) => {
    try {
        const { path } = req.body;
        if (!path) {
            res.status(400).json({ error: 'path is required' });
            return;
        }

        // path could be the dist directory, we need the project root
        const cwd = path.endsWith('dist') ? dirname(path) : path;

        const result = await startStaticServer({ cwd, reqApp: req.app });
        res.json({ success: true, url: result.url });
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
});

export const mountVueProjects = async (app: Application) => {
    const vueProjects = await sql((db) => db.vue);
    const validProjects = vueProjects.filter((project) => project.publicPath && project.publicPath.trim() !== '');
    for (let i = 0; i < validProjects.length; i++) {
        const project = validProjects[i];
        const staticPath = join(project.path, 'dist');
        // log(`vue静态资源已挂载: ${project.publicPath} -> ${staticPath}`);
        app.use(project.publicPath, express.static(staticPath));
    }
};
