import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execaCommand as execa } from 'execa';
import { isWin } from './constant';

const pythonExecutePath = join(
    fileURLToPath(import.meta.url),
    `../../src/lib/image-clipboard-${isWin ? 'win' : 'mac'}.py`
);
const pythonCmdName = isWin ? 'python' : 'python3';
const imageClipboard = {
    async write() {
        await execa(`${pythonCmdName} ${pythonExecutePath} --type=write`);
    },
    async read() {
        const { stdout } = await execa(`${pythonCmdName} ${pythonExecutePath} --type=read`);
        return stdout;
    },
};

export default imageClipboard;
