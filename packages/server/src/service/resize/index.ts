import BaseCommand from '@/common/BaseCommand';
import { execaCommand as execa } from 'execa';
import { cmdName, getExecutePath } from '@/common/_internal/pythonUtils';
const pythonExecutePath = getExecutePath('resize');
export interface Options {
    size: number;
}

export default class extends BaseCommand {
    async main(option: Options) {
        const { stdout } = await execa(`${cmdName} ${pythonExecutePath} --size=${option.size}`, {
            shell: true,
        });
        console.log(stdout);
    }
}
