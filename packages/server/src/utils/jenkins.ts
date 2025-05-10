import open from 'open';
import readPkg from 'read-pkg';
import sql from './sql';

interface JenkinsProject {
    name: string;
    id: string;
}

/**
 * 打开公司内部Jenkins部署页面
 */
export const openDeployPage = async (type?: string) => {
    const { id, name } = await getProjectName(type);
    if (id) {
        const isWork = true;
        const origin = await sql((db) => (isWork ? db.jenkins.url.internal : db.jenkins.url.public));
        await open(`http://${origin}/view/${name}/job/${id}/`);
    }
};

/**
 * 根据项目package.json中的jenkins属性值获取对应jenkins信息
 */
export const getProjectName = async (
    type?: string
): Promise<{
    name: string;
    id: string;
    onlineId?: string;
}> => {
    const projectConf = await readPkg({
        cwd: process.cwd(),
    });
    const finded = projectConf.jenkins;
    if (Array.isArray(finded)) {
        const jenkins = type
            ? (finded.find((item) => item.type === type) as JenkinsProject)
            : (finded[0] as JenkinsProject);
        if (!jenkins) {
            return {
                name: '',
                id: '',
            };
        }
        return {
            ...jenkins,
            onlineId: jenkins.id.replace(/[\-|_]test$/, ''),
        };
    }
    const jenkins = finded as JenkinsProject;
    if (!jenkins) {
        return {
            name: '',
            id: '',
        };
    }
    return {
        ...jenkins,
        onlineId: jenkins.id.replace(/[\-|_]test$/, ''),
    };
};
