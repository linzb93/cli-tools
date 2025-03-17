import { basename } from 'node:path';
import { Router } from 'express';
import sql from '@/common/sql';
import { showOpenDialog } from '@/common/dialog';
import responseFmt from '../shared/response';

const router = Router({});

router.post('/getList', (_, res) => {
    sql((db) => {
        if (!db.vue) {
            return [];
        }
        return db.vue;
    }).then((list) => {
        res.send(responseFmt({ list }));
    });
});

router.post('/select', (_, res) => {
    showOpenDialog('directory')
        .then((dir) => {
            return sql((db) => {
                if (!db.vue) {
                    db.vue = [
                        {
                            id: 1,
                            name: basename(dir),
                            path: dir,
                            command: '',
                        },
                    ];
                    return;
                }
                const last = db.vue.at(-1);
                const id = last.id + 1;
                db.vue.push({
                    id,
                    name: basename(dir),
                    path: dir,
                    command: '',
                });
            });
        })
        .then(() => {
            res.send(responseFmt());
        });
});

router.post('/edit', (req, res) => {
    const { id, name } = req.body;
    sql((db) => {
        const match = db.vue.find((item) => item.id === id);
        if (!match) {
            return;
        }
        match.name = name;
    }).then(() => {
        res.send(responseFmt());
    });
});

router.post('/delete', (req, res) => {
    const { id } = req.body;
    sql((db) => {
        const matchIndex = db.vue.findIndex((item) => item.id === id);
        if (matchIndex > -1) {
            db.vue.splice(matchIndex, 1);
        }
    }).then(() => {
        res.send(responseFmt());
    });
});

export default router;
