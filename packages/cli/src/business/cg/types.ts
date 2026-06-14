export interface Options {
    full: boolean;
}

export interface User {
    name: string;
    amount: number;
}
export interface CgSchema {
    oa: {
        dkdPrefix: string;
        apiPrefix: string;
    };
    cg: {
        name: string;
        nameId: number;
    };
}
