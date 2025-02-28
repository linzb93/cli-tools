import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execaCommand as execa } from 'execa';
import { isWin } from './constant';

const pythonExecutePath = join(
    fileURLToPath(import.meta.url),
    `../../src/lib/image-clipboard-${isWin ? 'win' : 'mac'}.py`
);

const imageClipboard = {
    async write() {
        await execa(`python ${pythonExecutePath} --type=write`);
    },
    async read() {
        return await execa(`python ${pythonExecutePath} --type=read`);
    },
};

export default imageClipboard;
