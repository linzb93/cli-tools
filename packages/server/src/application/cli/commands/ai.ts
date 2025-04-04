import Ai, { Options } from '@/service/ai';
import { isOldNode } from '@/common/helper';
import logger from '@/common/logger';
export default (input: string, rest: string[], options: Options) => {
    if (isOldNode) {
        logger.error('请使用node18+版本');
        return;
    }
    new Ai().main(input, rest, options);
};
