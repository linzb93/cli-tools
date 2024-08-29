import {join} from 'node:path';
import fs from 'fs-extra';
import pMap from 'p-map';
import BaseCommand from "../../shared/BaseCommand";

class Analyse extends BaseCommand {
    async run() {
        const dirs = await fs.readdir(join(process.cwd(), 'node_modules'));
        let destDirs = dirs.filter(dir => !dir.startsWith('.'));
        const countingList = await pMap(destDirs, async dir => {
            if (!dir.startsWith('@')) {
                return 1;
            }
            const subDirs = await fs.readdir(join(process.cwd(), 'node_modules', dir));
            return subDirs.length;
        }, {concurrency: 20});
        this.logger.success(`有${countingList.reduce((sum, item) => sum + item, 0)}个模块`);
    }
}

export default () => {
    return new Analyse().run()
}