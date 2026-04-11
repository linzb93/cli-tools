import intoStream from 'into-stream';
import OSS from 'ali-oss';
import { readSecret } from '@cli-tools/shared';
import { join } from 'node:path';
import slash from 'slash';
import { type Readable } from 'node:stream';
import { execaCommand as execa } from 'execa';
import { isWin, cmdName, parseJSON, getExecutePath } from '@cli-tools/shared';

const pythonExecutePath = getExecutePath(`image-clipboard-${isWin ? 'win' : 'mac'}`);
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

/**
 * 检查URL是否为图片
 * @param url URL字符串
 * @returns 是否为图片
 */
export const isImage = (url: string) => {
    return ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'].some((ext) => url.endsWith(ext));
};

export const imageClipboard = {
    /**
     * 读取剪贴板图片
     * @returns {Promise<string>} base64格式的图片
     */
    async read(): Promise<string> {
        const { stdout } = await execa(`${cmdName} ${pythonExecutePath} --type=read`);
        const data = parseJSON(stdout);
        if (data.success === 'true') {
            return data.data;
        }
        throw new Error(data.message);
    },
};
