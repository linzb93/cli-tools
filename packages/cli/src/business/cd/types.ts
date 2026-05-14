export interface Options {
    delete?: boolean;
    cwd?: boolean;
    alias?: boolean;
    keyword?: string;
}

export interface CdHistoryItem {
    path: string;
    count: number;
    alias?: string;
}
