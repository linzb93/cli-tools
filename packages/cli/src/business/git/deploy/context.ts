let currentCwd: string = process.cwd();

/**
 * 设置 deploy 命令的工作目录
 * @param {string} cwd - 工作目录路径
 */
export const setDeployCwd = (cwd: string) => {
    currentCwd = cwd;
};

/**
 * 获取 deploy 命令的工作目录
 * @returns {string} 工作目录路径
 */
export const getDeployCwd = () => currentCwd;
