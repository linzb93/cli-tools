/**
 * 临时文件上传，用完之后清除。
 */
import OSS from 'ali-oss';
import sql from './sql';
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

export const tempUpload = async (data: Params) => {
    const ossData = await sql((db) => db.oss);
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
