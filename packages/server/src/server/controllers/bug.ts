import { Router } from 'express';
import sql from '@/utils/sql';
import response from '../shared/response';
const router = Router();

router.post('/getApps', async (req, res) => {
    sql((db) => db.monitor)
        .then((result) => {
            response(res, {
                list: result,
            });
        })
        .catch((err) => {
            res.status(500).send(err);
        });
});
router.post('/saveApps', async (req, res) => {
    const { list } = req.body;
    sql((db) => {
        db.monitor = list;
    }).then(() => {
        response(res, null);
    });
});
export default router;
