import { DeployContext } from './types';

let context: DeployContext;

let defaultContext: DeployContext = {
    prod: false,
    type: 'v',
    version: '',
    open: false,
    commit: '',
    current: false,
    cwd: process.cwd(),
    mainBranch: '',
    currentBranch: '',
};

export const setContext = (ctx: Partial<DeployContext>) => {
    context = {
        ...defaultContext,
        ...context,
        ...ctx,
    };
};

export const getContext = () => context;
