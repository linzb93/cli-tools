/**
 * 找出 packages/cli/src 目录下所有驼峰命名的文件
 * 驼峰命名: 首字母小写，后面有至少一个大写字母 (如 baseDeploy.ts, server.ts)
 * 排除: PascalCase (首字母大写) 和 snake_case (全小写加下划线)
 */

import { resolve, join } from 'path';
import { readdirSync, statSync } from 'fs';

function isCamelCase(filename) {
    // 必须是 .ts, .js, .vue 文件
    if (!/\.(ts|js|vue)$/.test(filename)) return false;

    // 去掉扩展名
    const name = filename.replace(/\.(ts|js|vue)$/, '');

    // 排除包含下划线的 (snake_case)
    if (name.includes('_')) return false;

    // 排除全小写的 (不包括 index 这种特殊名)
    if (name === name.toLowerCase()) return false;

    // 驼峰: 首字母小写，且至少有一个大写字母
    const firstChar = name[0];
    const hasUpperCase = name
        .slice(1)
        .split('')
        .some((c) => c === c.toUpperCase() && c !== c.toLowerCase());

    return firstChar === firstChar.toLowerCase() && hasUpperCase;
}

function scanDir(dir) {
    const results = [];
    const entries = readdirSync(dir);

    for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
            results.push(...scanDir(fullPath));
        } else if (stat.isFile()) {
            if (isCamelCase(entry)) {
                results.push(fullPath);
            }
        }
    }

    return results;
}

const srcDir = resolve(process.cwd(), './packages/cli/src');
const camelCaseFiles = scanDir(srcDir);

console.log('=== 驼峰命名的文件 ===\n');
for (const file of camelCaseFiles) {
    // 转换为相对路径
    const relativePath = file.replace(srcDir + '/', '');
    console.log(relativePath);
}
console.log(`\n共 ${camelCaseFiles.length} 个文件`);
