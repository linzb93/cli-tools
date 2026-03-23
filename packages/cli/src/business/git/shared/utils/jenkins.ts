import open from 'open';
import { readPackage as readPkg } from 'read-pkg';
import { readSecret } from '@cli-tools/shared/utils/secret';
import fs from 'fs';
import path from 'path';

interface JenkinsProject {
    name: string;
    id: string;
    onlineId?: string;
    onlineName?: string;
    lastTag?: string;
    type?: string;
}

/**
 * 打开公司内部Jenkins部署页面
 */
export const openDeployPage = async (type?: string, isOnline?: boolean) => {
    const { id, name, onlineId, onlineName } = await getProjectName(type);
    if (id) {
        const isWork = true;
        const origin = await readSecret((db) => (isWork ? db.jenkins.url.internal : db.jenkins.url.public));
        await open(
            `http://${origin}/view/${isOnline ? onlineName || name : name}/job/${isOnline ? onlineId || id : id}/`,
            { wait: true },
        );
    }
};

/**
 * 根据项目package.json中的jenkins属性值获取对应jenkins信息
 */
export const getProjectName = async (type?: string): Promise<JenkinsProject> => {
    const projectConf = await readPkg({
        cwd: process.cwd(),
    });
    const finded = projectConf.jenkins;
    if (Array.isArray(finded)) {
        const jenkins =
            type && type !== 'v'
                ? (finded.find((item) => item.type === type) as JenkinsProject)
                : (finded.find((item) => !item.type) as JenkinsProject);
        if (!jenkins) {
            return {
                name: '',
                id: '',
                onlineId: '',
                onlineName: '',
            };
        }

        return {
            ...jenkins,
            onlineId: jenkins.onlineId || jenkins.id.replace(/[-_]test$/, ''),
        };
    }
    const jenkins = finded as JenkinsProject;
    if (!jenkins) {
        return {
            name: '',
            id: '',
            onlineId: '',
        };
    }
    return {
        ...jenkins,
        onlineId: jenkins.onlineId || jenkins.id.replace(/[-_]test$/, ''),
    };
};

/**
 * 更新 package.json 中的 lastTag
 */
export const updateLastTag = async (type: string | undefined, newTag: string): Promise<void> => {
    const pkgPath = path.resolve(process.cwd(), 'package.json');
    if (fs.existsSync(pkgPath)) {
        const pkgContent = await fs.promises.readFile(pkgPath, 'utf-8');
        const pkg = JSON.parse(pkgContent);
        if (pkg.jenkins) {
            if (Array.isArray(pkg.jenkins)) {
                const targetType = type && type !== 'v' ? type : undefined;
                const jenkinsItem = pkg.jenkins.find(
                    (item: JenkinsProject) => item.type === targetType || (!targetType && !item.type),
                );
                if (jenkinsItem) {
                    jenkinsItem.lastTag = newTag;
                }
            } else {
                pkg.jenkins.lastTag = newTag;
            }
            await fs.promises.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
        }
    }
};
