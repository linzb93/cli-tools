interface AnyObject {
    [key: string]: any;
}

export interface Database {
    lastModifiedTime: string;
    open: {
        [key: string]: string;
    };
    code: {
        [key: string]: string;
    };
    mock: {
        token: string;
        uid: string;
    };
    vue: {
        name: string;
        path: string;
        id: number;
    }[];
    menus: {
        title: string;
        to: string;
    }[];
    ai: {
        apiKey: string;
    };
    ipc: string;
    gitDirs: {
        path: string;
        name: string;
    }[];
    sync: {
        user: string;
        password: string;
    };
    oa: {
        apiPrefix?: string;
        testPrefix?: string;
        userApiPrefix?: string;
        oldApiPrefix?: string;
        username?: string;
        password?: string;
    };
    monitor: {
        siteId: string;
        name: string;
    }[];
    cg: {
        author: string;
        nameId: number;
        oldPrefix: string;
    };
    ip: {
        internal: string;
        public: string;
    };
    jenkins: {
        url: {
            internal: string;
            public: string;
        };
    };
}
