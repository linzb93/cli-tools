import open from 'open';
import readPkg from 'read-pkg';
import { readSecret } from '../../../utils/secret';

interface JenkinsProject {
    name: string;
    id: string;
    onlineId?: string;
    onlineName?: string;
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
            `http://${origin}/view/${isOnline ? onlineName || name : name}/job/${isOnline ? onlineId || id : id}/`
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
                : (finded[0] as JenkinsProject);
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
