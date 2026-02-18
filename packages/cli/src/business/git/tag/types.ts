export interface TagGetOptions {
    version?: string;
    type?: string;
    msg?: string;
}

export interface VersionInfo {
    prefix: string;
    major: number;
    minor: number;
    patch: number;
    build?: number;
}
