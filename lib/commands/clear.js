const del = require('del');
const globby = require('globby');
const pMap = require('p-map');
const consola = require('consola');

// 主要是来清理Windows上被Git同步过来的 macOS的 .DS_Store
module.exports = async filename => {
    const paths = await globby([ filename, `**/*/${filename}`, '!node_modules' ]);
    const len = paths.length;
    if (len === 0) {
        consola.info('未发现需要删除的文件');
        return;
    }
    await pMap(paths, async file => {
        return del(file);
    }, { concurrency: 10 });
    consola.success(`操作成功，共删除${len}个文件`);
};