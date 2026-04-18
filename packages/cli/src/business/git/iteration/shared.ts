import type { IterationContext } from './types';
let context: IterationContext;

const defaultContext: IterationContext = {
    projectPath: process.cwd(),
    pkgPath: '',
    currentVersion: '',
    newVersion: '',
    finalVersion: '',
    mainBranch: '',
    currentBranch: '',
    targetBranch: '',
    isMono: false,
    isGithub: false,
    fix: false,
    shouldCreateBranch: false,
};

export const setContext = (ctx: Partial<IterationContext>) => {
    context = {
        ...defaultContext,
        ...ctx,
    };
};

export const getContext = () => context;

export const isDebug = process.env.DEBUG === 'true';
