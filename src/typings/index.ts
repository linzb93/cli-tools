declare module 'kill-port' {
    export default function killPort(str:string,type:string):Promise<{
        stderr:string
    }>
}

declare module 'ali-oss' {
    interface OssConfig {}
    export default class OSS {
        constructor(config: OssConfig)
        put(uploadName:string,localPath:string):Promise<{
            name:string
        }>
    }
}