import { readSecret } from '@/utils/secret';
import { Router } from 'express';
import response from '../shared/response';
const router = Router();

router.post('/get', async (req, res) => {
    const secret = await readSecret((db) => db.oa);
    response(res, {
        api: secret,
    });
});

export default router;
