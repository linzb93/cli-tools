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
    const path = slash(join(uploadPath, `local-${Date.now()}`));
    if (data.type === 'url') {
        client.put(path, data.data);
    } else {
        client.putStream(path, data.data);
    }
    return {
        path,
        async removeHandler() {
            await client.delete(path);
        },
    };
};
