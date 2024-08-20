declare module "kill-port" {
  export default function killPort(
    port: string,
    type: string
  ): Promise<{
    stderr: string;
  }>;
}

declare module "global-modules" {
  const m: string;
  export default m;
}

declare module "uuid" {
  export function v4(): string;
}

declare module "macos-open-file-dialog" {
  export function openFile(title: string, types?: string[]): Promise<string>;
  export function openMultipleFiles(
    title: string,
    types?: string[]
  ): Promise<string>;
  export function openFolder(title: string): Promise<string>;
}

declare module "node-file-dialog" {
  interface Options {
    type: 'directory' | 'save-file' | 'open-file' | 'open-files'
  }
  export default function(options: Options):Promise<string>
}
