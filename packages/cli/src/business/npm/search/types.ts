export interface Options {
    open?: boolean;
    full?: boolean;
    help?: boolean;
}

interface OutputPkgItem {
    name: string;
    description: string;
    weeklyDl: string;
    lastPb: string;
    version: string;
}
