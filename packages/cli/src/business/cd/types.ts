export interface Options {
    delete?: boolean;
    cwd?: boolean;
    alias?: boolean;
    keyword?: string;
    recursive?: boolean;
    prev?: boolean;
}
export interface CdHistoryItem {
    path: string;
    count: number;
    alias?: string;
}
export interface CdSchema {
    cdHistory?: CdHistoryItem[];
    lastCdPath?: string;
    open?: {
        root: string;
    };
}
