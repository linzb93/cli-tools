declare module 'kill-port' {
  export default function killPort(
    port: string,
    type: string
  ): Promise<{
    stderr: string;
  }>;
}

declare module 'ali-oss' {
  interface OssConfig {
    region: string;
    accessKeyId: string;
    accessKeySecret: string;
    bucket: string;
    timeout: number;
  }
  export default class OSS {
    constructor(config: OssConfig);
    put(
      uploadName: string,
      localPath: string
    ): Promise<{
      name: string;
    }>;
  }
}

declare module 'global-modules' {
  const m: string;
  export default m;
}

declare module 'windows-shortcuts' {
  interface QueryCallback {
    (err: string | null, lnk: { target: string }): void;
  }
  export function query(pathName: string, callback: QueryCallback): void;
}

declare module 'uuid' {
  export function v4(): string;
}
