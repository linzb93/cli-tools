import { Router } from 'express';
import sql from '@/utils/sql';
const router = Router();

router.post('/getApps', async (req, res) => {
    sql((db) => db.monitor)
        .then((result) => {
            res.send({
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
        res.send(null);
    });
});
export default router;
