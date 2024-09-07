interface AnyObject {
  [key: string]: any;
}

export interface Database {
  lastModifiedTime: string;
  vue: {
    name: string;
    path: string;
    id: number;
  }[];
  css: {
    pixio: 1 | 2;
    platform: 1 | 2;
    template: string;
  };
  menus: {
    title: string;
    to: string;
  }[];
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
}
