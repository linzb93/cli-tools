import { BaseDeploy } from './BaseDeploy';
import { CompanyDeploy } from '../implementations/CompanyDeploy';
import { GithubDeploy } from '../implementations/GithubDeploy';
import { isGithubProject } from '../../shared/utils';

export const Factory = {
    async create(): Promise<BaseDeploy> {
        if (await isGithubProject()) {
            return new GithubDeploy();
        }
        return new CompanyDeploy();
    },
};
