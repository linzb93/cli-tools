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

declare module 'multer' {
    interface Upload {
        single(type: string): void;
    }
    export default function (): Upload;
}
