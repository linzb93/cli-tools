declare module 'kill-port' {
    export default function killPort(str:string,type:string):Promise<{
        stderr:string
    }>
}