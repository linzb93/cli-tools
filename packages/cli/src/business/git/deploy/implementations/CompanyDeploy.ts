import { BaseDeploy } from '../core/BaseDeploy';
import { getContext } from '../shared';
import { openDeployPage } from '../../shared/utils/jenkins';
import { logger } from '@/utils/logger';
import inquirer from '@/utils/inquirer';
import { tagService, Options as TagOptions } from '../../tag/get';

export class CompanyDeploy extends BaseDeploy {
    async start(): Promise<void> {
        const options = getContext();
        const { currentBranch, mainBranch } = options;
        if (currentBranch === mainBranch) {
            await this.handleMasterBranch();
        } else if (currentBranch === 'release') {
            await this.handleReleaseBranch();
        } else {
            await this.handleOtherBranch();
        }
    }
    /**
     * 处理主分支的部署流程
     * @returns {Promise<void>}
     */
    private async handleMasterBranch(): Promise<void> {
        await this.executeBaseManagers();
        const context = getContext();
        if (!context.current) {
            await this.handleTagAndOutput();
        }
        if (context.open) {
            await openDeployPage(context.type, true);
        }
    }
    /**
     * 处理release分支的部署流程
     * @returns {Promise<void>}
     */
    private async handleReleaseBranch(): Promise<void> {
        await this.executeBaseManagers();
        const context = getContext();
        // 打开Jenkins主页
        if (context.open !== false) {
            await openDeployPage(context.type);
        }
    }
    /**
     * 处理其他分支的部署流程
     * @returns {Promise<void>}
     */
    private async handleOtherBranch(): Promise<void> {
        const context = getContext();
        const { mainBranch } = context;
        await this.executeBaseManagers();

        if (context.prod) {
            // 询问用户是否确认发布
            const { confirmDeploy } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirmDeploy',
                    message: `确认要发布项目吗？这将合并代码到${mainBranch}分支并发布`,
                    default: false,
                },
            ]);

            if (!confirmDeploy) {
                logger.info('已取消发布操作');
                return;
            }
            // 合并到主分支
            await this.mergeToBranch(mainBranch, false);
            await this.handleTagAndOutput();
        } else if (!context.current) {
            // 合并到release分支
            await this.mergeToBranch('release', true);

            // 打开Jenkins主页
            if (context.open !== false) {
                await openDeployPage(context.type);
            }
        }
    }
    /**
     * 处理标签和输出信息
     * @returns {Promise<void>}
     */
    private async handleTagAndOutput(): Promise<void> {
        const context = getContext();

        let version = context.version;

        // 创建tag选项
        const tagOptions: TagOptions = {
            type: context.type,
            version: version || '',
            msg: context.commit,
        };

        await tagService(tagOptions);
    }
}
