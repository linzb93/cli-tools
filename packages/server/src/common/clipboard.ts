import { execaCommand as execa } from 'execa';
import { isWin } from './constant';
import { cmdName, parseJSON, getExecutePath } from './_internal/pythonUtils';

const pythonExecutePath = getExecutePath(isWin ? 'win' : 'mac');
const imageClipboard = {
    async write() {
        await execa(`${cmdName} ${pythonExecutePath} --type=write`);
    },
    async read() {
        const { stdout } = await execa(`${cmdName} ${pythonExecutePath} --type=read`);
        const data = parseJSON(stdout);
        if (data.success === 'true') {
            return data.data;
        }
        throw new Error(data.message);
    },
};

export default imageClipboard;
