import BaseCommand from '../../BaseCommand';
import { DeployOptions } from './BaseDeployCommand';
import DeployCommandFactory from './DeployCommandFactory';

/**
 * Git Deploy命令入口类
 * 用于创建适当的部署命令实例并执行部署流程
 */
export type { DeployOptions as Options };

export default class extends BaseCommand {
    /**
     * 主执行函数
     * @param {DeployOptions} options - 命令选项
     */
    async main(options: DeployOptions): Promise<void> {
        try {
            options.commit = options.commit || 'update';
            // 创建适当的部署命令实例
            const deployCommand = await DeployCommandFactory.createDeployCommand(options);

            // 执行部署流程
            await deployCommand.main();
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
