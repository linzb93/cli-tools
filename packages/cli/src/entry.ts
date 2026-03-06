#!/usr/bin/env node
if (Number(process.version.split('.')[0].replace('v', '')) < 20) {
    console.log(`当前 Node.js 版本为 ${process.version}，低于 20，请切换到 20`);
} else {
    import('./cli.js');
}
