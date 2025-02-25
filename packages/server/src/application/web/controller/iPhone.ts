import fs from 'node:fs';
import { join, basename } from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import intoStream from 'into-stream';
import { notify, copy, readCopy } from '@/common/helper';
import { changeTempUrlToPath } from '../shared';
import memCache from '../shared/memCache';
import { HTTP_STATUS, tempPath } from '@/common/constant';
import responseFmt from '../shared/response';
import { showOpenDialog } from '@/common/dialog';

const router = Router({});
const upload = multer();
const cacheImgName = 'iPhoneImg';
export default router;

// iPhone发往电脑
router.post('/sendCopyData', (req, res) => {
    const { text } = req.body;
    const decodedText = decodeURIComponent(text);
    notify(decodedText);
    copy(decodedText);
    res.send(responseFmt());
});

// iPhone从电脑获取
router.get('/getCopyData', (_, res) => {
    const copyData = readCopy();
    res.send(
        responseFmt({
            text: copyData,
        })
    );
});

// iPhone批量获取电脑图片地址
router.get('/getImgList', (_, res) => {
    const list = memCache.get(cacheImgName);
    res.send(
        responseFmt({
            list,
        })
    );
});

// 同步图片
let syncImgLength = 0;
router.post('/sync', (req, res) => {
    const list = req.body as string[];
    memCache.set(cacheImgName, list);
    syncImgLength = list.length;
    res.send(responseFmt());
});

// iPhone下载电脑图片
router.get('/getImg', (req, res) => {
    const path = req.query.path as string;
    fs.createReadStream(changeTempUrlToPath(path))
        .pipe(res)
        .on('finish', () => {
            syncImgLength -= 1;
            if (!syncImgLength) {
                memCache.delete(cacheImgName);
            }
        });
});
router.post('/batchSendImg', upload.single('file'), (req, res) => {
    const uid = Date.now();
    const filename = join(tempPath, `${uid}.jpg`);
    req.pipe(fs.createWriteStream(filename)).on('finish', () => {
        const imgs = memCache.get(cacheImgName);
        if (!imgs) {
            memCache.set(cacheImgName, [filename]);
        } else {
            memCache.set(cacheImgName, imgs.concat(filename));
        }
        res.send('ok');
    });
});

router.post('/sendImg', upload.single('file'), (req, res) => {
    const uid = Date.now();
    const filename = join(tempPath, `${uid}.jpg`);
    intoStream(req.file.buffer)
        .pipe(fs.createWriteStream(filename))
        .on('finish', () => {
            const imgs = memCache.get(cacheImgName);
            if (!imgs) {
                memCache.set(cacheImgName, [filename]);
            } else {
                memCache.set(cacheImgName, imgs.concat(filename));
            }
            res.send('ok');
        });
});

router.post('/save', (_, res) => {
    showOpenDialog('directory').then((dir) => {
        console.log(dir);
        const imgs = memCache.get(cacheImgName);
        if (!imgs) {
            res.send(
                responseFmt({
                    code: HTTP_STATUS.BAD_REQUEST,
                    message: '没有图片',
                })
            );
            return;
        }
        for (const img of imgs) {
            fs.createReadStream(img).pipe(fs.createWriteStream(join(dir, basename(img))));
        }
        res.send(responseFmt());
        memCache.delete(cacheImgName);
    });
});

// const obs$ = new Observable((observer) => {
//   // iPhone给电脑发送图片
//   router.post("/send-img", upload.single("file"), async (req, res) => {
//     const uid = Date.now();
//     const filename = join(tempPath, `${uid}.jpg`);
//     intoStream(req.file.buffer)
//       .pipe(fs.createWriteStream(filename))
//       .on("finish", () => {
//         observer.next(
//           `http://localhost:${config.port.production}${config.static}/${uid}.jpg`
//         );
//         res.send("ok");
//       });
//   });
//   // iPhone给电脑批量发送图片
//   router.post("/send-img-batch", (req, res) => {
//     const uid = Date.now();
//     const filename = join(tempPath, `${uid}.jpg`);
//     req.pipe(fs.createWriteStream(filename)).on("finish", () => {
//       observer.next(
//         `http://localhost:${config.port.production}${config.static}/${uid}.jpg`
//       );
//       res.send("ok");
//     });
//   });
// });
// obs$.subscribe({
//   next: (url) => {
//     mainPost({
//       method: "iPhone-upload-img",
//       data: url,
//       listener: false,
//     });
//   },
// });
// obs$.pipe(debounceTime(3000)).subscribe(() => {
//   notify(`收到来自iPhone的图片`);
// });
