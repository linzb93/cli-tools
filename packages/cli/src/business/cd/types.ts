export interface Options {
    delete?: boolean;
    cwd?: boolean;
    alias?: boolean;
}

export interface CdHistoryItem {
    path: string;
    count: number;
    alias?: string;
}
