import { Router } from 'express';
import fs from 'node:fs';
import intoStream from 'into-stream';
import Ai from '@/service/ai';
import multer from 'multer';
const router = Router();
const upload = multer();
router.post('/upload', upload.single('file'), (req, res) => {
    const file = req.file;
    intoStream(req.file.buffer)
        .pipe(fs.createWriteStream('./1.png'))
        .on('finish', async () => {
            const result = await getAiResult();
            res.send(result);
        });
});

async function getAiResult() {
    const result = new Ai().use([
        {
            role: 'system',
            content: `你是一个高级Web前端开发者。请根据我上传的图表，生成echarts配置项。用json格式输出结果，json不要换行。格式如下：
    - success: boolean类型，如果是图表且生成成功，返回true，否则返回false
    - options: object类型，echarts配置项，如果不是图表或者没有生成成功，返回null`,
        },
    ]);
    return result;
}

export default router;
