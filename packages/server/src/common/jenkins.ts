import open from "open";
import readPkg from "read-pkg";
import { isWin } from "./constant";
import ls from "./ls";

interface JenkinsProject {
  name: string;
  id: string;
}

export const openDeployPage = async () => {
  const projectConf = await readPkg({
    cwd: process.cwd(),
  });
  const jenkins = projectConf.jenkins as JenkinsProject;
  if (jenkins) {
    const { name, id } = jenkins;
    await open(
      `http://${
        isWin ? ls.get("jenkins.ur.internal") : ls.get("jenkins.url.public")
      }/view/${name}/job/${id}/`
    );
  }
};
