import { Router } from 'express';
import fs from 'fs-extra';
import { diffArrays } from 'diff';
import responseFmt from '../shared/response';
const router = Router({});
export default router;

router.post('/folder', (req, res) => {
    const { sourcePath, targetPath } = req.body;
    const oldArr = fs.readdirSync(sourcePath);
    const newArr = fs.readdirSync(targetPath);
    const diff = diffArrays(oldArr, newArr);
    res.send(
        responseFmt({
            diff,
        })
    );
});
