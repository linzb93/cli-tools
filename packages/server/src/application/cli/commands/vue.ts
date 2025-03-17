import Vue, { Options } from '@/service/vue';
import { isOldNode } from '@/common/helper';
import logger from '@/common/logger';
export default (options: Options) => {
    if (!isOldNode) {
        logger.error('请使用node14版本');
        return;
    }
    new Vue().main(options);
};
