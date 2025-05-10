import Ai, { Options } from '@/core/ai';
import { isOldNode } from '@/utils/helper';
import { logger } from '@/utils/logger';
export default (input: string, rest: string[], options: Options) => {
    if (isOldNode) {
        logger.error('请使用node18+版本');
        return;
    }
    new Ai().main(input, rest, options);
};
