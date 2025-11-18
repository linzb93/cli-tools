import { readSecret } from '@/utils/secret';
import { Router } from 'express';
import response from '../shared/response';
const router = Router();

router.post('/get', (_, res) => {
    readSecret((db) => db.oa).then((secret) => {
        response(res, {
            api: secret,
        });
    });
});

export default router;
