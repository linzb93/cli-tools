import imageClipboard from '@/common/clipboard';
import fs from 'node:fs';
export default async () => {
    let base64Data = '';
    try {
        base64Data = await imageClipboard.read();
    } catch (error) {
        console.log(error.message);
        return;
    }
    const base64Image = base64Data.split(';base64,').pop();

    // 将 Base64 数据解码并保存为文件
    fs.writeFile('output.png', base64Image, 'base64', (err) => {
        if (err) {
            console.error('保存文件失败:', err);
        } else {
            console.log('图片已保存为 output.png');
        }
    });
};
