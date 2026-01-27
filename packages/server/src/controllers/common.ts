import { Router } from 'express';
import response from '../shared/response';
import axios from 'axios';
const router = Router();

/**
 * 浏览器的跨域请求通过这个发送
 */
router.post('/fetchApiCrossOrigin', (req, res) => {
    axios({
        method: 'get',
        url: req.body.url,
    }).then((res1) => {
        response(res, res1.data);
    });
});

export default router;
