import { join } from 'node:path';
import { log } from '../shared/log';
import sql from '@cli-tools/shared/utils/sql';
import express, { type Application } from 'express';

export const mountVueProjects = async (app: Application) => {
    const vueProjects = await sql((db) => db.vue);
    const validProjects = vueProjects.filter((project) => project.publicPath && project.publicPath.trim() !== '');
    for (let i = 0; i < validProjects.length; i++) {
        const project = validProjects[i];
        const staticPath = join(project.path, 'dist');
        log(`vue静态资源已挂载: ${project.publicPath} -> ${staticPath}`);
        app.use(project.publicPath, express.static(staticPath));
    }
};
