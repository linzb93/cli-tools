import { Router } from 'express';
import { HTTP_STATUS } from '@cli-tools/shared';
import { success, error as responseError } from '../shared/response';
import axios from 'axios';
const router = Router();

/**
 * 浏览器的跨域请求通过这个发送
 */
router.post('/fetchApiCrossOrigin', async (req, res) => {
    try {
        const res1 = await axios({
            method: 'get',
            url: req.body.url,
        });
        success(res, res1.data);
    } catch (error) {
        responseError(res, (error as Error).message || '请求失败', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
});

export default router;
