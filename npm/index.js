const flagMap = {
  's': 'search', // 查找npmjs.com
  'c': 'clear',  // 删除
  'h': 'has',    // 查找本地
  'r': 'require',// 是否都已安装
  'i': 'include' // 模糊搜索
};
module.exports = (args, flag) => {
  if (flagMap[flag]) {
    require(`./${flagMap[flag]}`)(args);
  }
}