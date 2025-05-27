import { Router } from 'express';
import sql from '@/utils/sql';
import response from '../shared/response';
const router = Router();

router.post('/list', (req, res) => {
    sql((db) => db.agent).then((list) => {
        response(res, list);
    });
});

router.post('/save', (req, res) => {
    const { id, name, prefix, rules } = req.body;
    sql((db) => {
        const match = db.agent.find((item) => item.id === id);
        if (match) {
            match.name = name;
            match.prefix = prefix;
            match.rules = rules;
        } else {
            db.agent.push({ id, name, prefix, rules });
        }
    }).then(() => {
        response(res, {});
    });
});

router.post('/delete', (req, res) => {
    const { id } = req.body;
    sql((db) => {
        db.agent = db.agent.filter((item) => item.id !== id);
    }).then(() => {
        response(res, {});
    });
});

export default router;

export const agentCallback = () => {};
