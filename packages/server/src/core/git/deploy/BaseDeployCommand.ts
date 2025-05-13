import BaseCommand from '../../BaseCommand';
import { execaCommand as execa } from 'execa';
import { executeCommands } from '@/utils/promise';
import gitAtom from '../atom';
import clipboardy from 'clipboardy';
import { getProjectName } from '@/utils/jenkins';
import { getCurrentBranchName, getMainBranchName, isGitProject } from '../utils';

/**
 * Deploy命令选项接口
 */
export interface DeployOptions {
    /**
     * 是否发布到master或main分支
     * @default false
     */
    prod?: boolean;
    /**
     * 项目类型，用于标记tag
     */
    type?: string;
    /**
     * 项目版本号，用于标记tag
     */
    version?: string;
    /**
     * 是否打开对应的jenkins主页
     * @default false
     */
    open?: boolean;
    /**
     * git commit提交信息
     */
    commit: string;
    /**
     * 仅完成基础命令后结束任务
     * @default false
     */
    current?: boolean;
    /**
     * 是否跳过pull命令
     * @default false
     */
    skipPull?: boolean;
}

/**
 * Git Deploy命令基类
 * 定义了部署命令的通用结构和抽象方法
 */
export default abstract class BaseDeployCommand extends BaseCommand {
    protected options: DeployOptions;
    protected currentBranch: string = '';
    protected mainBranch: string = '';

    /**
     * 构造函数
     * @param {DeployOptions} options - 命令选项
     */
    constructor(options: DeployOptions) {
        super();
        this.options = options;
    }

    /**
     * 检查是否为Github项目
     * @returns {Promise<boolean>} 是否为Github项目
     */
    protected async isGithubProject(): Promise<boolean> {
        try {
            const { stdout } = await execa('git remote -v');
            return stdout.includes('github.com');
        } catch (error) {
            return false;
        }
    }

    /**
     * 检查是否有未提交的更改
     * @returns {Promise<boolean>} 是否有未提交的更改
     */
    protected async hasChanges(): Promise<boolean> {
        try {
            const { stdout } = await execa('git status -s');
            return stdout.trim() !== '';
        } catch (error) {
            this.logger.error('检查未提交更改失败');
            return false;
        }
    }

    /**
     * 为项目打tag
     * @param {string} type - 标签类型
     * @param {string} version - 版本号
     * @returns {Promise<string>} 创建的标签名称
     */
    protected async createTag(type?: string, version?: string): Promise<string> {
        try {
            // 获取当前日期作为版本号的一部分
            const date = new Date();
            const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(
                date.getDate()
            ).padStart(2, '0')}`;

            // 如果没有提供版本号，则使用日期
            const versionStr = version || dateStr;

            // 组合标签名
            const tagPrefix = type ? `${type}-` : 'v';
            const tagName = `${tagPrefix}${versionStr}`;

            // 创建并推送标签
            await execa(`git tag ${tagName}`);
            await execa('git push --tags');

            return tagName;
        } catch (error) {
            this.logger.error('创建标签失败');
            throw error;
        }
    }

    /**
     * 完成基础git命令（add, commit, pull, push）
     * @param {string} commitMessage - 提交信息
     * @param {boolean} [skipPull=false] - 是否跳过pull命令
     * @returns {Promise<void>}
     */
    protected async executeBaseCommands(commitMessage: string, skipPull: boolean = false): Promise<void> {
        this.logger.info('执行基础Git命令...');

        try {
            const commands = ['git add .', gitAtom.commit(commitMessage)];

            // 根据 skipPull 参数决定是否添加 pull 命令
            if (!skipPull) {
                commands.push(gitAtom.pull());
            }

            commands.push(gitAtom.push());

            await executeCommands(commands);

            this.logger.success('基础Git命令执行完成');
        } catch (error) {
            this.logger.error('基础Git命令执行失败');
            throw error;
        }
    }

    /**
     * 合并到指定分支
     * @param {string} targetBranch - 目标分支
     * @param {boolean} [switchBackToBranch=false] - 是否切换回原分支
     * @returns {Promise<void>}
     */
    protected async mergeToBranch(targetBranch: string, switchBackToBranch: boolean = false): Promise<void> {
        this.logger.info(`合并代码到 ${targetBranch} 分支...`);

        try {
            // 保存当前分支
            await execa(`git checkout ${targetBranch}`);
            await executeCommands([gitAtom.pull(), gitAtom.merge(this.currentBranch), gitAtom.push()]);

            // 根据参数决定是否切回原分支
            if (switchBackToBranch) {
                await execa(`git checkout ${this.currentBranch}`);
            }

            this.logger.success(`代码已成功合并到 ${targetBranch} 分支`);
        } catch (error) {
            // 如果需要切换回原始分支，并且出现错误
            if (switchBackToBranch) {
                try {
                    await execa(`git checkout ${this.currentBranch}`);
                } catch (checkoutError) {
                    this.logger.error('切回原始分支失败');
                }
            }

            this.logger.error(`合并到 ${targetBranch} 分支失败`);
            throw error;
        }
    }

    /**
     * 初始化分支信息
     * @returns {Promise<void>}
     */
    protected async initBranchInfo(): Promise<void> {
        // 检查是否是Git项目
        const isGit = await isGitProject();
        if (!isGit) {
            throw new Error('当前目录不是Git项目');
        }

        // 获取当前分支
        this.currentBranch = await getCurrentBranchName();
        if (!this.currentBranch) {
            throw new Error('获取当前分支失败');
        }

        // 获取主分支
        this.mainBranch = await getMainBranchName();
        if (!this.mainBranch) {
            this.mainBranch = 'master'; // 默认使用master
        }
    }

    /**
     * 处理用户输入
     * @returns {Promise<void>}
     */
    protected async handleUserInput(): Promise<void> {
        // 检查是否有未提交的更改
        const hasChanges = await this.hasChanges();

        if (!hasChanges && !this.options.commit) {
            // 询问用户提供commit信息
            const { commitMessage } = await this.inquirer.prompt([
                {
                    type: 'input',
                    name: 'commitMessage',
                    message: '请输入commit信息:',
                    validate: (input) => !!input || '提交信息不能为空',
                },
            ]);

            this.options.commit = commitMessage;
        }
    }

    /**
     * 处理项目部署的抽象方法
     * 不同类型的项目需要实现各自的部署逻辑
     * @returns {Promise<void>}
     */
    protected abstract handleProjectDeploy(): Promise<void>;

    /**
     * 主执行函数
     */
    public async main(): Promise<void> {
        try {
            await this.handleUserInput();
            await this.initBranchInfo();
            await this.handleProjectDeploy();
            this.logger.success('部署流程已完成');
        } catch (error) {
            if (error instanceof Error) {
                this.logger.error(error.message);
            } else {
                this.logger.error('部署过程中发生未知错误');
            }
            process.exit(1);
        }
    }
}
