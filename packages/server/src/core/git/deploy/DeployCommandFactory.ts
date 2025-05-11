import { execaCommand as execa } from 'execa';
import BaseDeployCommand, { DeployOptions } from './BaseDeployCommand';
import CompanyDeployCommand from './CompanyDeployCommand';
import GithubDeployCommand from './GithubDeployCommand';

/**
 * 部署命令工厂类
 * 负责创建适当的部署命令实例
 */
export default class DeployCommandFactory {
    /**
     * 检查是否为Github项目
     * @returns {Promise<boolean>} 是否为Github项目
     */
    private static async isGithubProject(): Promise<boolean> {
        try {
            const { stdout } = await execa('git remote -v');
            return stdout.includes('github.com');
        } catch (error) {
            return false;
        }
    }

    /**
     * 创建部署命令实例
     * @param {DeployOptions} options - 命令选项
     * @returns {Promise<BaseDeployCommand>} 部署命令实例
     */
    static async createDeployCommand(options: DeployOptions): Promise<BaseDeployCommand> {
        const isGithub = await this.isGithubProject();

        if (isGithub) {
            return new GithubDeployCommand(options);
        } else {
            return new CompanyDeployCommand(options);
        }
    }
}
