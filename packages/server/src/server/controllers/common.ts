import { readSecret } from '@/utils/secret';
import { Router } from 'express';
import response from '../shared/response';
import axios from 'axios';
const router = Router();

router.post('/fetchApiCrossOrigin', (req, res) => {
    axios({
        method: 'get',
        url: req.body.url,
    }).then((res1) => {
        response(res, res1.data);
    });
});

export default router;
