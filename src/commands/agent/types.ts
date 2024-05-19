export interface ChildProcessEmitData {
    port?: string;
    ip?: string;
    type: 'close' | 'uncaughtException' | 'unhandledRejection',
    errorMessage: string;
  }
