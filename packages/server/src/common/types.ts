export type BaseType = number | string | boolean;

export interface AnyObject {
  [name: string]: any;
}

export interface SecretDB {
  open: {
    [name: string]: string;
  };
  code: {
    [name: string]: string;
  };
  oss: {
    region: string;
    accessKeyId: string;
    accessKeySecret: string;
    bucket: string;
  };
  debug: boolean;
  oa: {
    username: string;
    password: string;
    token: string;
  };
}
