export interface Options {
    delete?: boolean;
    cwd?: boolean;
}

export interface CdHistoryItem {
    path: string;
    count: number;
}
