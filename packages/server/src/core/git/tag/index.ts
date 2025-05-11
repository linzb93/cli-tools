import { execa } from 'execa';
import chalk from 'chalk';
import BaseCommand from '../../BaseCommand';
import { isGitProject, getAllTags } from '../utils';
import inquirer from '@/utils/inquirer';
import { executeCommands, CommandConfig } from '@/utils/promise';
import semver from 'semver';

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
     * 子命令
     * @default ""
     */
    _?: string[];
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
    async main(options: Options): Promise<void> {
        // 检查当前目录是否是 Git 项目
        if (!(await isGitProject())) {
            this.logger.error('当前目录不是 Git 项目');
            return;
        }

        // 处理子命令
        const subCommand = options._?.[0] || '';

        // 子命令映射表
        const commandMap: Record<string, () => Promise<void>> = {
            '': () => this.addTag(options),
            'delete': () => this.deleteTag(),
            'sync': () => this.syncTag(),
        };

        // 执行对应的子命令
        if (commandMap[subCommand]) {
            await commandMap[subCommand]();
        } else {
            this.logger.error(`未知的 git tag 子命令: ${subCommand}`);
            this.logger.info('可用的子命令: ' + Object.keys(commandMap).filter(Boolean).join(', '));
        }
    }

    /**
     * 创建标签
     * @param {string} tagName - 标签名称
     * @returns {CommandConfig} 命令配置
     */
    private createTag(tagName: string): CommandConfig {
        return {
            message: `git tag ${tagName}`,
        };
    }

    /**
     * 推送标签到远程仓库
     * @param {string} tagName - 标签名称
     * @returns {CommandConfig} 命令配置
     */
    private pushTag(tagName: string): CommandConfig {
        return {
            message: `git push origin ${tagName}`,
            onError: (message) => {
                if (message.includes('not found')) {
                    console.warn(`远程仓库不存在标签: ${tagName}`);
                }
                return {
                    shouldStop: false,
                };
            },
        };
    }

    /**
     * 删除本地标签
     * @param {string} tagName - 标签名称
     * @returns {CommandConfig} 命令配置
     */
    private deleteTagCmd(tagName: string): CommandConfig {
        return {
            message: `git tag -d ${tagName}`,
            onError: (message) => {
                console.warn(`删除本地标签失败: ${message}`);
                return {
                    shouldStop: false,
                };
            },
        };
    }

    /**
     * 删除远程标签
     * @param {string} tagName - 标签名称
     * @returns {CommandConfig} 命令配置
     */
    private deleteRemoteTag(tagName: string): CommandConfig {
        return {
            message: `git push origin --delete ${tagName}`,
            onError: (message) => {
                console.warn(`删除远程标签失败: ${message}`);
                return {
                    shouldStop: false,
                };
            },
        };
    }

    /**
     * 拉取所有远程标签
     * @returns {CommandConfig} 命令配置
     */
    private fetchTags(): CommandConfig {
        return {
            message: 'git fetch --tags',
            onError: (message) => {
                console.error(`拉取远程标签失败: ${message}`);
                return {
                    shouldStop: true,
                };
            },
        };
    }

    /**
     * 添加标签
     * @param {Options} options - 命令选项
     * @returns {Promise<void>}
     */
    private async addTag(options: Options): Promise<void> {
        const { version, type = 'v' } = options;

        try {
            // 获取所有标签
            const tags = await getAllTags();

            // 生成新标签
            const newTag = await this.generateNewTag(tags, type, version);

            this.logger.info(`正在创建标签: ${chalk.green(newTag)}`);

            // 创建本地标签并推送到远程
            await executeCommands([this.createTag(newTag), this.pushTag(newTag)]);

            this.logger.success(`成功创建并推送标签 ${chalk.green(newTag)}`);
        } catch (error) {
            this.logger.error(`创建标签失败: ${error.message || error}`);
        }
    }

    /**
     * 删除标签
     * @returns {Promise<void>}
     */
    private async deleteTag(): Promise<void> {
        try {
            // 获取所有标签
            const tags = await getAllTags();

            if (tags.length === 0) {
                this.logger.warn('当前项目没有标签');
                return;
            }

            // 提示用户选择要删除的标签
            const { selectedTags } = await inquirer.prompt({
                type: 'checkbox',
                name: 'selectedTags',
                message: '请选择要删除的标签',
                choices: tags.map((tag) => ({ name: tag, value: tag })),
            });

            if (!selectedTags.length) {
                this.logger.info('未选择任何标签，操作已取消');
                return;
            }

            this.logger.info(`正在删除选中的 ${selectedTags.length} 个标签...`);

            // 删除本地标签和远程标签
            for (const tag of selectedTags) {
                await executeCommands([this.deleteTagCmd(tag), this.deleteRemoteTag(tag)]);
                this.logger.info(`已删除标签 ${chalk.yellow(tag)}`);
            }

            this.logger.success('标签删除操作完成');
        } catch (error) {
            this.logger.error(`删除标签失败: ${error.message || error}`);
        }
    }

    /**
     * 同步标签
     * @returns {Promise<void>}
     */
    private async syncTag(): Promise<void> {
        try {
            // 获取所有标签
            const tags = await getAllTags();

            if (tags.length > 0) {
                this.logger.info(`正在删除 ${tags.length} 个本地标签...`);

                // 删除所有本地标签
                await execa('git', ['tag', '-d'].concat(tags));
            }

            // 拉取所有远程标签
            this.logger.info('正在从远程拉取所有标签...');
            await executeCommands([this.fetchTags()]);

            const updatedTags = await getAllTags();
            this.logger.success(`标签同步完成，现有 ${updatedTags.length} 个标签`);
        } catch (error) {
            this.logger.error(`同步标签失败: ${error.message || error}`);
        }
    }

    /**
     * 根据现有标签生成新标签
     * @param {string[]} tags - 现有标签列表
     * @param {string} type - 标签类型前缀
     * @param {string | undefined} version - 指定的版本号
     * @returns {Promise<string>} 新标签
     */
    async generateNewTag(tags: string[], type: string = 'v', version?: string): Promise<string> {
        // 过滤出带有指定前缀的标签
        const prefixedTags = tags.filter((tag) => tag.startsWith(type));

        // 如果没有匹配的标签，创建初始版本
        if (prefixedTags.length === 0) {
            return version ? `${type}${version}` : `${type}1.0.0`;
        }

        // 解析版本号的函数
        const parseVersion = (tag: string): VersionInfo | null => {
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
        };

        // 获取最大版本标签
        let maxVersion: VersionInfo | null = null;

        for (const tag of prefixedTags) {
            const version = parseVersion(tag);
            if (!version) continue;

            if (!maxVersion) {
                maxVersion = version;
                continue;
            }

            // 比较版本大小
            if (version.major > maxVersion.major) {
                maxVersion = version;
            } else if (version.major === maxVersion.major) {
                if (version.minor > maxVersion.minor) {
                    maxVersion = version;
                } else if (version.minor === maxVersion.minor) {
                    if (version.patch > maxVersion.patch) {
                        maxVersion = version;
                    } else if (version.patch === maxVersion.patch) {
                        if ((version.build || 0) > (maxVersion.build || 0)) {
                            maxVersion = version;
                        }
                    }
                }
            }
        }

        // 如果没有找到有效的版本，使用默认版本
        if (!maxVersion) {
            return version ? `${type}${version}` : `${type}1.0.0`;
        }

        // 如果指定了版本号
        if (version) {
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

        // 未指定版本号，自动增加最后一位
        if (maxVersion.build !== undefined) {
            // 已经是四段式版本号，增加最后一位
            return `${type}${maxVersion.major}.${maxVersion.minor}.${maxVersion.patch}.${maxVersion.build + 1}`;
        } else {
            // 三段式版本号，增加第四位
            return `${type}${maxVersion.major}.${maxVersion.minor}.${maxVersion.patch}.1`;
        }
    }
}

/**
 * 根据现有标签生成新标签
 * @param {string[]} tags - 现有标签列表
 * @param {string} type - 标签类型前缀
 * @param {string | undefined} version - 指定的版本号
 * @returns {Promise<string>} 新标签
 */
export const generateNewTag = async (tags: string[], type: string = 'v', version?: string): Promise<string> => {
    const tagCommand = new (class extends BaseCommand {
        async main() {} // 空实现
    })();

    // @ts-ignore - 访问私有方法
    return tagCommand.generateNewTag(tags, type, version);
};
