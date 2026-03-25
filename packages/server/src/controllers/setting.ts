import { readSecret } from '@cli-tools/shared';
import { Router } from 'express';
import response from '../shared/response';
const router = Router();

router.post('/get', async (_, res) => {
    try {
        const secret = await readSecret((db) => db.oa);
        response(res, {
            api: secret,
        });
    } catch (error) {
        response(res, { message: error.message });
    }
});

export default router;
