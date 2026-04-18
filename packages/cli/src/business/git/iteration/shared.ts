import type { IterationContext } from './types';
let context: IterationContext;

const defaultContext: IterationContext = {
    projectPath: process.cwd(),
    pkgPath: '',
    newVersion: '',
    currentBranch: '',
    targetBranch: '',
};

export const isDebug = process.env.DEBUG === 'true';
