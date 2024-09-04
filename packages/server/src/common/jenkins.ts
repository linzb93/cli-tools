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
  const projectConf = await readPkg({
    cwd: process.cwd(),
  });
  const jenkins = projectConf.jenkins as JenkinsProject;
  if (jenkins) {
    await open(
      `http://${
        isInWorkEnv ? ls.get("jenkins.url.internal") : ls.get("jenkins.url.public")
      }/view/${jenkins.name}/job/${jenkins.id}/` 
    );
  }
};
