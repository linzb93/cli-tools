import { Router } from 'express';
import sql from '@/common/sql';
import { HTTP_STATUS } from '@/common/constant';
import useScan from '@/service/git/useScan';
import responseFmt from '../shared/response';
import logger from '@/common/logger';
import { sse, setHeader } from '../shared/sse';

const router = Router({});

// 获取项目列表
router.post('/get', (_, res) => {
    sql((db) => db.gitDirs).then((list) => {
        res.send(responseFmt({ list }));
    });
});
// 保存已选的项目列表
router.post('/save', (req, res) => {
    sql((db) => {
        db.gitDirs = req.body;
    }).then(() => {
        res.send(responseFmt());
    });
});

router.get('/gitScanResult', (req, res) => {
    setHeader(res);
    sql(async (db) => db.gitDirs)
        .then((dirs) => {
            if (!dirs) {
                throw new Error('未初始化，请选择要扫描的文件夹');
            }
            return useScan();
        })
        .then(({ counter$, list$, total$ }) => {
            // total$.subscribe((total:number) => {
            //   res.write(sse(total));
            // })
            counter$.subscribe((count) => {
                res.write(sse(count));
            });
            list$.subscribe((list: any) => {
                logger.web('扫描完成');
                res.write(
                    sse(
                        {
                            list: list.filter((item) => ![0, 3].includes(item.status)),
                        },
                        true
                    )
                );
                res.end();
            });
        })
        .catch((e) => {
            res.send(
                responseFmt({
                    code: HTTP_STATUS.BAD_REQUEST,
                    message: e,
                })
            );
        });
});

export default router;
