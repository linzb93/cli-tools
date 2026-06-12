declare module 'better-sqlite3' {
  interface RunResult {
    changes: number;
    lastInsertRowid: number | bigint;
  }

  class Statement<T = any> {
    run(...params: any[]): RunResult;
    get(...params: any[]): T | undefined;
    all(...params: any[]): T[];
    iterate(...params: any[]): IterableIterator<T>;
  }

  interface Options {
    readonly?: boolean;
    fileMustExist?: boolean;
    timeout?: number;
    verbose?: ((message?: any, ...additionalArgs: any[]) => void) | null;
  }

  class Database {
    constructor(filename: string, options?: Options);
    prepare<T = any>(sql: string): Statement<T>;
    exec(sql: string): this;
    close(): void;
  }

  export = Database;
}
