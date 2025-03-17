import Ai from '@/service/ai';
import { isOldNode } from '@/common/helper';
import logger from '@/common/logger';
export default (input: string, rest: string[]) => {
    if (isOldNode) {
        logger.error('请使用node18+版本');
        return;
    }
    new Ai().main(input, rest);
};
