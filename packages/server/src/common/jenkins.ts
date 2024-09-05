import open from "open";
import readPkg from "read-pkg";
import { isInWorkEnv } from "./constant";
import ls from "./ls";

interface JenkinsProject {
  name: string;
  id: string;
}

/**
 * 打开公司内部Jenkins部署页面
 */
export const openDeployPage = async () => {
  const {id, name} = await getProjectName();
  if (id) {
    await open(
      `http://${
        isInWorkEnv ? ls.get("jenkins.url.internal") : ls.get("jenkins.url.public")
      }/view/${name}/job/${id}/` 
    );
  }
};

export const getProjectName = async (): Promise<{
  name: string;
  id: string;
  onlineId?: string;
}> => {
  const projectConf = await readPkg({
    cwd: process.cwd(),
  });
  const jenkins = projectConf.jenkins as JenkinsProject;
  if (!jenkins) {
    return {
      name: '',
      id: '',
    };
  }
  return {
    ...jenkins,
    onlineId: jenkins.id.replace(/[\-|_]test$/, "")
  };
}
