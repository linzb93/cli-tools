import { execaCommand as execa } from 'execa';
import { isWin } from './constant';
import { cmdName, parseJSON, getExecutePath } from './_internal/pythonUtils';

const pythonExecutePath = getExecutePath(`image-clipboard-${isWin ? 'win' : 'mac'}`);
const imageClipboard = {
    /**
     * 读取剪贴板图片
     * @returns {Promise<string>} base64格式的图片
     */
    async read(): Promise<string> {
        const { stdout } = await execa(`${cmdName} ${pythonExecutePath} --type=read`);
        const data = parseJSON(stdout);
        if (data.success === 'true') {
            return data.data;
        }
        throw new Error(data.message);
    },
};

export default imageClipboard;
