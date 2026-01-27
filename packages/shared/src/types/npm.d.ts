declare module 'kill-port' {
    export default function killPort(
        port: string,
        type: string
    ): Promise<{
        stderr: string;
    }>;
}

declare module 'global-modules' {
    const m: string;
    export default m;
}

declare module 'uuid' {
    export function v4(): string;
}
declare module 'ali-oss' {
    import { Readable } from 'node:stream';
    interface OssConfig {
        region: string;
        accessKeyId: string;
        accessKeySecret: string;
        bucket: string;
        domain: string;
    }
    interface OSSObject {
        objects: {
            /**
             * 单位：B
             */
            size: number;
            /**
             * 绝对地址
             */
            name?: string;
            type: string;
            url: string;
            lastModified: string;
        }[];
        /**
         * 完整的目录列表
         */
        prefixes: string[];
        /**
         * 查询下一页列表用的token
         */
        nextContinuationToken: string;
    }
    interface BucketObject {
        name: string;
    }
    export default class OSS {
        constructor(config: OssConfig);
        /**
         * 上传文件，或者创建目录
         * @param {string} uploadName - 绝对地址
         * @param {string | Buffer} localPath - 本地文件的地址，或者是Buffer
         */
        put(
            uploadName: string,
            localPath: string | Buffer
        ): Promise<{
            name: string;
        }>;
        putStream(path: string, stream: Readable): void;
        multipartUpload(
            prefix: string,
            path: string,
            {
                progress,
            }: {
                progress: (percent: number) => void;
            }
        ): Promise<string>;
        listV2(obj: { 'prefix': string; 'delimiter'?: string; 'max-keys': number }): Promise<OSSObject>;
        /**
         * 删除文件或者目录
         */
        delete(
            obj:
                | string
                | {
                      prefix: string;
                  }
        ): Promise<void>;
        listBuckets(): Promise<{
            buckets: BucketObject[];
        }>;
    }
}
