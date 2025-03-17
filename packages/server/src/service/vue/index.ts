import BaseCommand from '@/common/BaseCommand';
import { showOpenDialog } from '@/common/dialog';
import { execaCommand as execa } from 'execa';
import { resolve } from 'node:path';
import { fork } from 'node:child_process';
export interface Options {
    command: string;
}

export default class Vue extends BaseCommand {
    async main(options: Options) {
        const cwd = await showOpenDialog('directory');
        // const { stdout } = await execa(`npm run ${options.command || 'build'}`, { cwd });
        // const app = express();
        // app.use(express.static(join(cwd, 'dist')));
        // app.listen(3000, () => {
        //     console.log('Server is running on port 3000');
        // })
        // const child = fork('', {
        //       cwd,
        //       detached: true,
        //       stdio: [null, null, null, "ipc"],
        //     });
    }
}
