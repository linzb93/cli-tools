import Vue, { Options } from '@/core/vue';
import { isOldNode } from '@/utils/helper';
import { logger } from '@/utils/logger';
export default (options: Options) => {
    if (!isOldNode) {
        logger.error('请使用node14版本');
        return;
    }
    new Vue().main(options);
};
