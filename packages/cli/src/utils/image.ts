import intoStream from 'into-stream';
import OSS from 'ali-oss';
import { readSecret } from '@cli-tools/shared/utils/secret';
import { join } from 'node:path';
import slash from 'slash';
import { type Readable } from 'node:stream';
type Params =
    | {
          type: 'url';
          data: string;
      }
    | {
          type: 'stream';
          data: Readable;
      };
/**
 * 临时文件上传至OSS，用完之后清除。
 */
export const tempUpload = async (data: Params) => {
    const ossData = await readSecret((db) => db.oss);
    const { uploadPath, ...config } = ossData;
    const client = new OSS(config);
    const ossPath = slash(join(uploadPath, `local-${Date.now()}.png`));
    const url = `${ossData.domain}/${ossPath}`;
    if (data.type === 'url') {
        client.put(ossPath, data.data);
    } else {
        client.putStream(ossPath, data.data);
    }
    return {
        url,
        async removeHandler() {
            await client.delete(ossPath);
        },
    };
};
/**
 * 将图片base64字符串转换为图片流
 * @param base64 图片base64字符串
 * @returns 图片流
 */
export const imageBase64ToStream = (base64: string) => {
    return intoStream(imageBase64ToBuffer(base64));
};

/**
 * 将图片base64字符串转换为图片Buffer
 * @param base64 图片base64字符串
 * @returns 图片Buffer
 */
export const imageBase64ToBuffer = (base64: string) => {
    return Buffer.from(base64, 'base64');
};
