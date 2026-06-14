import { readSecret } from '@cli-tools/shared/node';
import { Router } from 'express';
import { HTTP_STATUS } from '@cli-tools/shared';
import { success, error as responseError } from '../shared/response';
const router = Router();

router.post('/get', async (_, res) => {
    try {
        const secret = await readSecret((db) => db.oa);
        success(res, {
            api: secret,
        });
    } catch (error) {
        responseError(res, (error as Error).message || '获取配置失败', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
});

export default router;
