import chalk from 'chalk';
import semver from 'semver';
import clipboardy from 'clipboardy';
import { logger } from '@/utils/logger';
import { executeCommands } from '@/utils/promise';
import { isGitProject, getAllTags } from '../../shared/utils';
import { getProjectName, updateLastTag } from '../../shared/utils/jenkins';
import type { TagGetOptions as Options, VersionInfo } from '../types';

/**
 * 解析标签字符串为版本信息对象
 * @param {string} tag - 标签字符串
 * @param {string} type - 标签前缀类型
 * @returns {VersionInfo | null} 解析后的版本信息对象，如果不匹配则返回 null
 * @example
 * const info = parseVersion('v1.2.3', 'v');
 * // info 结果包含: { prefix: 'v', major: 1, minor: 2, patch: 3 }
 * const info2 = parseVersion('v1.2.3.4', 'v');
 * // info2 结果包含: { prefix: 'v', major: 1, minor: 2, patch: 3, build: 4 }
 */
const parseVersion = (tag: string, type: string): VersionInfo | null => {
    const versionStr = tag.substring(type.length);
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

/**
 * 从版本信息数组中查找最大版本
 * @param {VersionInfo[]} versions - 版本信息对象数组
 * @returns {VersionInfo} 最大版本信息对象
 * @example
 * const max = findMaxVersion([
 *   { prefix: 'v', major: 1, minor: 0, patch: 0 },
 *   { prefix: 'v', major: 1, minor: 1, patch: 0 }
 * ]);
 * // max 结果包含: { prefix: 'v', major: 1, minor: 1, patch: 0 }
 */
const findMaxVersion = (versions: VersionInfo[]): VersionInfo => {
    return versions.reduce((max, current) => {
        if (current.major > max.major) {
            return current;
        }
        if (current.major === max.major) {
            if (current.minor > max.minor) {
                return current;
            }
            if (current.minor === max.minor) {
                if (current.patch > max.patch) {
                    return current;
                }
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
};

/**
 * 创建初始版本号
 * @param {string} type - 标签前缀类型
 * @param {string} [version] - 可选的指定版本号
 * @returns {string} 初始版本号字符串
 * @example
 * const v1 = createInitialVersion('v');
 * // v1 === 'v1.0.0'
 * const v2 = createInitialVersion('v', '2.0.0');
 * // v2 === 'v2.0.0'
 */
const createInitialVersion = (type: string, version?: string): string => {
    return version ? `${type}${version}` : `${type}1.0.0`;
};

/**
 * 创建指定的版本号，并验证其是否合法且大于当前最大版本
 * @param {string} type - 标签前缀类型
 * @param {string} version - 指定的版本号
 * @param {VersionInfo} maxVersion - 当前最大版本信息
 * @returns {string} 生成的指定版本号字符串
 * @example
 * const max = { prefix: 'v', major: 1, minor: 0, patch: 0 };
 * const v = createSpecifiedVersion('v', '1.1.0', max);
 * // v === 'v1.1.0'
 */
const createSpecifiedVersion = (type: string, version: string, maxVersion: VersionInfo): string => {
    if (!semver.valid(version)) {
        throw new Error(`无效的版本号格式: ${version}，请使用三段式版本号如 1.0.0`);
    }
    const currentMax = `${maxVersion.major}.${maxVersion.minor}.${maxVersion.patch}`;
    if (semver.lt(version, currentMax)) {
        throw new Error(`指定的版本号 ${version} 小于当前最新版本 ${currentMax}`);
    }
    return `${type}${version}`;
};

/**
 * 判断版本 v1 是否大于或等于 v2
 * @param {VersionInfo} v1 - 第一个版本信息
 * @param {VersionInfo} v2 - 第二个版本信息
 * @returns {boolean} 如果 v1 大于等于 v2 返回 true，否则返回 false
 * @example
 * const v1 = { prefix: 'v', major: 1, minor: 1, patch: 0 };
 * const v2 = { prefix: 'v', major: 1, minor: 0, patch: 0 };
 * const res = isVersionGreaterOrEqual(v1, v2);
 * // res === true
 */
const isVersionGreaterOrEqual = (v1: VersionInfo, v2: VersionInfo): boolean => {
    if (v1.major !== v2.major) return v1.major > v2.major;
    if (v1.minor !== v2.minor) return v1.minor > v2.minor;
    if (v1.patch !== v2.patch) return v1.patch > v2.patch;
    const b1 = v1.build || 0;
    const b2 = v2.build || 0;
    return b1 >= b2;
};

/**
 * 创建递增的四级版本号
 * @param {string} type - 标签前缀类型
 * @param {VersionInfo} maxVersion - 当前最大版本信息
 * @param {VersionInfo | null} lastTagVersion - 上次打标的版本信息
 * @returns {string} 递增后的版本号字符串
 * @example
 * const max = { prefix: 'v', major: 1, minor: 0, patch: 0 };
 * const last = { prefix: 'v', major: 1, minor: 0, patch: 0, build: 1 };
 * const v = createIncrementedVersion('v', max, last);
 * // v === 'v1.0.0.2'
 */
const createIncrementedVersion = (
    type: string,
    maxVersion: VersionInfo,
    lastTagVersion: VersionInfo | null,
): string => {
    if (lastTagVersion && lastTagVersion.build !== undefined && isVersionGreaterOrEqual(lastTagVersion, maxVersion)) {
        return `${type}${lastTagVersion.major}.${lastTagVersion.minor}.${lastTagVersion.patch}.${lastTagVersion.build + 1}`;
    }
    if (maxVersion.build !== undefined) {
        return `${type}${maxVersion.major}.${maxVersion.minor}.${maxVersion.patch}.${maxVersion.build + 1}`;
    } else {
        return `${type}${maxVersion.major}.${maxVersion.minor}.${maxVersion.patch}.1`;
    }
};

/**
 * 根据现有标签和配置生成新的标签
 * @param {string[]} tags - 现有标签字符串数组
 * @param {string} [type='v'] - 标签前缀类型
 * @param {string} [version] - 可选的指定版本号
 * @returns {Promise<{ newTag: string; shouldUpdateLastTag: boolean }>} 包含新标签和是否需要更新 lastTag 标志的对象
 */
const generateNewTag = async (
    tags: string[],
    type: string = 'v',
    version?: string,
): Promise<{ newTag: string; shouldUpdateLastTag: boolean }> => {
    const prefixedTags = tags.filter((tag) => tag.startsWith(type));
    if (prefixedTags.length === 0) {
        return { newTag: createInitialVersion(type, version), shouldUpdateLastTag: false };
    }
    const versions = prefixedTags.map((tag) => parseVersion(tag, type)).filter((v) => v !== null) as VersionInfo[];
    if (versions.length === 0) {
        return { newTag: createInitialVersion(type, version), shouldUpdateLastTag: false };
    }
    const maxVersion = findMaxVersion(versions);
    if (version) {
        return { newTag: createSpecifiedVersion(type, version, maxVersion), shouldUpdateLastTag: false };
    } else {
        const jenkinsConfig = await getProjectName(type);
        const lastTagVersion = jenkinsConfig.lastTag ? parseVersion(jenkinsConfig.lastTag, type) : null;
        return { newTag: createIncrementedVersion(type, maxVersion, lastTagVersion), shouldUpdateLastTag: true };
    }
};

/**
 * 执行打标签和推送的完整服务流程
 * @param {Options} options - 命令行选项
 * @returns {Promise<void>} 异步任务，无返回值
 */
export const tagService = async (options: Options): Promise<void> => {
    if (!(await isGitProject())) {
        logger.error('当前目录不是 Git 项目');
        return;
    }

    const { version, type = 'v' } = options;

    try {
        const tags = await getAllTags();

        if (tags.length === 0) {
            logger.info('当前项目没有标签');
            return;
        }

        const { newTag, shouldUpdateLastTag } = await generateNewTag(tags, type, version);

        logger.info(`正在创建标签: ${chalk.green(newTag)}`);

        await executeCommands([
            {
                message: `git tag ${newTag}`,
                onError: async () => {
                    return {
                        shouldStop: true,
                    };
                },
            },
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

        if (shouldUpdateLastTag) {
            await updateLastTag(type, newTag);
        }

        const { onlineId } = await getProjectName(type);
        const copyText = `${onlineId}, tag:${newTag}${options.msg ? `，更新内容：${options.msg}。` : '。'}`;
        logger.success(`创建成功，复制项目信息 ${chalk.green(copyText)}`);
        clipboardy.writeSync(copyText);
    } catch (error) {
        logger.error(`创建标签失败: ${error.message || error}`);
    }
};
