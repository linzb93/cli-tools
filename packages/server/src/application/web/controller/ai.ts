import { Router } from 'express';
import Ai from '@/service/ai/Impl';
import multer from 'multer';
import { tempUpload } from '@/common/image';
import intoStream from 'into-stream';
import responseFmt from '../shared/response';

const router = Router();
const upload = multer();
router.post('/upload', upload.single('file'), async (req, res) => {
    const stream = intoStream(req.file.buffer);
    const result = await tempUpload({
        type: 'stream',
        data: stream,
    });
    getAiResult(result.url).then((output) => {
        result.removeHandler();
        res.send(
            responseFmt({
                data: output,
            })
        );
    });
});

async function getAiResult(remoteUrl: string) {
    const result = await new Ai().use(
        [
            {
                role: 'system',
                content: `你是一个高级Web前端开发者。请根据我上传的图表，生成echarts配置项。用json格式输出结果，json不要换行。格式如下：
    - success: boolean类型，如果是图表且生成成功，返回true，否则返回false
    - options: object类型，echarts配置项，如果不是图表或者没有生成成功，返回null`,
            },
            {
                role: 'user',
                content: [
                    {
                        type: 'image_url',
                        image_url: {
                            url: remoteUrl,
                            detail: 'high',
                        },
                    },
                ],
            },
        ],
        {
            type: 'image',
        }
    );
    if (result.startsWith(`\`\`\`json`)) {
        console.log(`返回格式不对`);
        const filtered = result.replace(`\`\`\`json`, '').replace(`\`\`\``, '');
        try {
            return JSON.parse(filtered);
        } catch (error) {
            console.log(`json格式化错误`);
            console.log(filtered);
        }
    }
    try {
        return JSON.parse(result);
    } catch (error) {
        console.log(`json格式化错误`);
        return result;
    }
}

export default router;
