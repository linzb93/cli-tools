export interface OssSchema {
    oss: {
        domain: string;
        region: string;
        accessKeyId: string;
        accessKeySecret: string;
        bucket: string;
        uploadPath: string;
    };
}
export interface OpenSchema {
    open: {
        root: string;
    };
}
