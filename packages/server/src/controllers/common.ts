import { Router } from 'express';
import response from '../shared/response';
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
        response(res, res1.data);
    } catch (error) {
        response(res, { message: error.message });
    }
});

export default router;
