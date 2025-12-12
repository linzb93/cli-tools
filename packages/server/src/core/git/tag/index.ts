import chalk from 'chalk';
import BaseCommand from '../../BaseCommand';
import { isGitProject, getAllTags } from '../utils';
import { executeCommands } from '@/utils/promise';
import semver from 'semver';
import { getProjectName } from '@/utils/jenkins';
import clipboardy from 'clipboardy';
import TagDelete from './delete';
import TagSync from './sync';

/**
 * git tag 命令的选项接口
 */
export interface Options {
    /**
     * 版本号
     * @default ""
     */
    version?: string;
    /**
     * 标签类型前缀
     * @default "v"
     */
    type?: string;
    /**
     * 提交消息
     * @default ""
     */
    msg?: string;
}

/**
 * 版本信息接口
 */
interface VersionInfo {
    /**
     * 项目类型前缀
     */
    prefix: string;
    /**
     * 主版本号
     */
    major: number;
    /**
     * 次版本号
     */
    minor: number;
    /**
     * 补丁版本号
     */
    patch: number;
    /**
     * 构建版本号
     */
    build?: number;
}

/**
 * git tag 命令的实现类
 */
export default class extends BaseCommand {
    /**
     * 命令的主入口函数
     * @param {Options} options - 命令选项
     * @returns {Promise<void>}
     */
    async main(subCommand: string, options: Options): Promise<void> {
        // 检查当前目录是否是 Git 项目
        if (!(await isGitProject())) {
            this.logger.error('当前目录不是 Git 项目');
            return;
        }

        // 子命令映射表
        const commandMap: Record<string, () => Promise<void>> = {
            '': () => this.addTag(options),
            'delete': () => new TagDelete().main(),
            'sync': () => new TagSync().main(),
        };

        // 执行对应的子命令
        if (!subCommand) {
            await this.addTag(options);
        } else if (commandMap[subCommand]) {
            await commandMap[subCommand]();
        } else {
            this.logger.error(`未知的 git tag 子命令: ${subCommand}`);
            this.logger.info('可用的子命令: ' + Object.keys(commandMap).filter(Boolean).join(', '));
        }
    }

    /**
     * 添加标签
     * @param {Options} options - 命令选项
     * @returns {Promise<void>}
     */
    async addTag(options: Options): Promise<void> {
        const { version, type = 'v' } = options;

        try {
            // 获取所有标签
            const tags = await getAllTags();

            if (tags.length === 0) {
                this.logger.info('当前项目没有标签');
                return;
            }

            // 生成新标签
            const newTag = await this.generateNewTag(tags, type, version);

            this.logger.info(`正在创建标签: ${chalk.green(newTag)}`);

            // 创建本地标签并推送到远程
            await executeCommands([
                // 创建标签
                {
                    message: `git tag ${newTag}`,
                },
                // 推送标签到远程仓库
                {
                    message: `git push origin ${newTag}`,
                    onError: async (message) => {
                        if (message.includes('not found')) {
                            console.warn(`远程仓库不存在标签: ${newTag}`);
                        }
                        return {
                            shouldStop: false,
                        };
                    },
                },
            ]);

            const { onlineId } = await getProjectName(type);
            const copyText = `${onlineId}, tag:${newTag}${options.msg ? `，更新内容：${options.msg}。` : '。'}`;
            this.logger.success(`创建成功，复制项目信息 ${chalk.green(copyText)}`);
            clipboardy.writeSync(copyText);
        } catch (error) {
            this.logger.error(`创建标签失败: ${error.message || error}`);
        }
    }

    /**
     * 根据现有标签生成新标签
     * @param {string[]} tags - 现有标签列表
     * @param {string} type - 标签类型前缀
     * @param {string | undefined} version - 指定的版本号
     * @returns {Promise<string>} 新标签
     */
    private async generateNewTag(tags: string[], type: string = 'v', version?: string): Promise<string> {
        // 过滤出带有指定前缀的标签
        const prefixedTags = tags.filter((tag) => tag.startsWith(type));

        // 如果没有匹配的标签，创建初始版本
        if (prefixedTags.length === 0) {
            return this.createInitialVersion(type, version);
        }

        // 解析所有版本信息
        const versions = prefixedTags
            .map((tag) => this.parseVersion(tag, type))
            .filter((v) => v !== null) as VersionInfo[];

        // 如果没有有效版本，使用默认版本
        if (versions.length === 0) {
            return this.createInitialVersion(type, version);
        }

        // 找到最大版本
        const maxVersion = this.findMaxVersion(versions);

        // 根据是否提供了版本号来决定创建方式
        if (version) {
            return this.createSpecifiedVersion(type, version, maxVersion);
        } else {
            return this.createIncrementedVersion(type, maxVersion);
        }
    }

    /**
     * 解析版本号字符串为版本信息对象
     * @param {string} tag - 标签字符串
     * @param {string} type - 标签类型前缀
     * @returns {VersionInfo | null} 版本信息对象，若无法解析则返回null
     */
    private parseVersion(tag: string, type: string): VersionInfo | null {
        // 移除前缀
        const versionStr = tag.substring(type.length);

        // 尝试解析四段式版本号 (如 1.2.3.4)
        const fourPartMatch = versionStr.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
        if (fourPartMatch) {
            return {
                prefix: type,
                major: parseInt(fourPartMatch[1]),
                minor: parseInt(fourPartMatch[2]),
                patch: parseInt(fourPartMatch[3]),
                build: parseInt(fourPartMatch[4]),
            };
        }

        // 尝试解析三段式版本号 (如 1.2.3)
        const threePartMatch = versionStr.match(/^(\d+)\.(\d+)\.(\d+)$/);
        if (threePartMatch) {
            return {
                prefix: type,
                major: parseInt(threePartMatch[1]),
                minor: parseInt(threePartMatch[2]),
                patch: parseInt(threePartMatch[3]),
            };
        }

        return null;
    }

    /**
     * 在版本列表中找出最大版本
     * @param {VersionInfo[]} versions - 版本信息对象数组
     * @returns {VersionInfo} 最大版本信息对象
     */
    private findMaxVersion(versions: VersionInfo[]): VersionInfo {
        return versions.reduce((max, current) => {
            // 主版本号比较
            if (current.major > max.major) {
                return current;
            }

            // 主版本号相同时，比较次版本号
            if (current.major === max.major) {
                if (current.minor > max.minor) {
                    return current;
                }

                // 次版本号相同时，比较补丁版本号
                if (current.minor === max.minor) {
                    if (current.patch > max.patch) {
                        return current;
                    }

                    // 补丁版本号相同时，比较构建版本号
                    if (current.patch === max.patch) {
                        const currentBuild = current.build || 0;
                        const maxBuild = max.build || 0;

                        if (currentBuild > maxBuild) {
                            return current;
                        }
                    }
                }
            }

            return max;
        }, versions[0]);
    }

    /**
     * 创建初始版本标签
     * @param {string} type - 标签类型前缀
     * @param {string | undefined} version - 指定的版本号
     * @returns {string} 新标签
     */
    private createInitialVersion(type: string, version?: string): string {
        return version ? `${type}${version}` : `${type}1.0.0`;
    }

    /**
     * 使用指定版本号创建新标签
     * @param {string} type - 标签类型前缀
     * @param {string} version - 指定的版本号
     * @param {VersionInfo} maxVersion - 当前最大版本信息
     * @returns {string} 新标签
     */
    private createSpecifiedVersion(type: string, version: string, maxVersion: VersionInfo): string {
        // 验证指定的版本号格式
        if (!semver.valid(version)) {
            throw new Error(`无效的版本号格式: ${version}，请使用三段式版本号如 1.0.0`);
        }

        // 将指定的版本号与当前最大版本比较
        const currentMax = `${maxVersion.major}.${maxVersion.minor}.${maxVersion.patch}`;
        if (semver.lt(version, currentMax)) {
            throw new Error(`指定的版本号 ${version} 小于当前最新版本 ${currentMax}`);
        }

        return `${type}${version}`;
    }

    /**
     * 根据当前最大版本自动生成递增的版本号
     * @param {string} type - 标签类型前缀
     * @param {VersionInfo} maxVersion - 当前最大版本信息
     * @returns {string} 新标签
     */
    private createIncrementedVersion(type: string, maxVersion: VersionInfo): string {
        if (maxVersion.build !== undefined) {
            // 已经是四段式版本号，增加最后一位
            return `${type}${maxVersion.major}.${maxVersion.minor}.${maxVersion.patch}.${maxVersion.build + 1}`;
        } else {
            // 三段式版本号，增加第四位
            return `${type}${maxVersion.major}.${maxVersion.minor}.${maxVersion.patch}.1`;
        }
    }
}
