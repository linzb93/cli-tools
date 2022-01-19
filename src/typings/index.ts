declare module 'kill-port' {
    export default function killPort(str: number, type: string): Promise<{
        stderr: string
    }>
}

declare module 'ali-oss' {
    interface OssConfig {
        region: string
        accessKeyId: string
        accessKeySecret: string
        bucket: string
        timeout: number
    }
    export default class OSS {
        constructor(config: OssConfig)
        put(uploadName: string, localPath: string): Promise<{
            name: string
        }>
    }
}

declare module 'global-modules' {
    const m:string;
    export default m;
}