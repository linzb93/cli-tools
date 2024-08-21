interface AnyObject {
  [key: string]: any;
}

export interface Database {
  lastModifiedTime: string;
  oss: {
    accounts: {
      id: number;
      platform?: string;
      name?: string;
      domain?: string;
      shortcut?: string;
      region: string;
      accessKeyId: string;
      accessKeySecret: string;
      bucket: string;
    }[];
    setting: {
      pixel: 1 | 2;
      platform: 1 | 2;
      previewType: 1 | 2;
      fasterEnter: 1 | 2;
    };
    history: {
      path: string;
      createTime: string;
    }[];
  };
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
  schedule: {
    gitDirs: {
      path: string;
      name: string;
    }[];
  };

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
