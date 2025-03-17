import { cmdName, getExecutePath } from '@/common/_internal/pythonUtils';
import { execaCommand as execa } from 'execa';
import logger from '@/common/logger';

interface Options {
    size: number;
}

export default (options: Options) => {
    execa(`${cmdName} ${getExecutePath('base64Copy')} --size=${options.size || 16}`).then(() => {
        logger.info('复制成功');
    });
};
