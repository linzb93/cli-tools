import chalk from 'chalk';
import semver from 'semver';
import clipboardy from 'clipboardy';
import { logger } from '../../../../utils/logger';
import { executeCommands } from '../../../../utils/promise';
import { isGitProject, getAllTags } from '../../shared/utils';
import { getProjectName } from '../../shared/utils/jenkins';

export interface Options {
    version?: string;
    type?: string;
    msg?: string;
}

interface VersionInfo {
    prefix: string;
    major: number;
    minor: number;
    patch: number;
    build?: number;
}

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

const findMaxVersion = (versions: VersionInfo[]): VersionInfo => {
    return versions.reduce((max, current) => {
        if (current.major > max.major) return current;
        if (current.major === max.major) {
            if (current.minor > max.minor) return current;
            if (current.minor === max.minor) {
                if (current.patch > max.patch) return current;
                if (current.patch === max.patch) {
                    const currentBuild = current.build || 0;
                    const maxBuild = max.build || 0;
                    if (currentBuild > maxBuild) return current;
                }
            }
        }
        return max;
    }, versions[0]);
};

const createInitialVersion = (type: string, version?: string): string => {
    return version ? `${type}${version}` : `${type}1.0.0`;
};

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

const createIncrementedVersion = (type: string, maxVersion: VersionInfo): string => {
    if (maxVersion.build !== undefined) {
        return `${type}${maxVersion.major}.${maxVersion.minor}.${maxVersion.patch}.${maxVersion.build + 1}`;
    } else {
        return `${type}${maxVersion.major}.${maxVersion.minor}.${maxVersion.patch}.1`;
    }
};

const generateNewTag = async (tags: string[], type: string = 'v', version?: string): Promise<string> => {
    const prefixedTags = tags.filter((tag) => tag.startsWith(type));
    if (prefixedTags.length === 0) {
        return createInitialVersion(type, version);
    }
    const versions = prefixedTags
        .map((tag) => parseVersion(tag, type))
        .filter((v) => v !== null) as VersionInfo[];
    if (versions.length === 0) {
        return createInitialVersion(type, version);
    }
    const maxVersion = findMaxVersion(versions);
    if (version) {
        return createSpecifiedVersion(type, version, maxVersion);
    } else {
        return createIncrementedVersion(type, maxVersion);
    }
};

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

        const newTag = await generateNewTag(tags, type, version);

        logger.info(`正在创建标签: ${chalk.green(newTag)}`);

        await executeCommands([
            {
                message: `git tag ${newTag}`,
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

        const { onlineId } = await getProjectName(type);
        const copyText = `${onlineId}, tag:${newTag}${options.msg ? `，更新内容：${options.msg}。` : '。'}`;
        logger.success(`创建成功，复制项目信息 ${chalk.green(copyText)}`);
        clipboardy.writeSync(copyText);
    } catch (error) {
        logger.error(`创建标签失败: ${error.message || error}`);
    }
};
