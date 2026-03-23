import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { sql } from '@cli-tools/shared';

export async function cdService(targetPath?: string) {
    if (targetPath) {
        // 如果输入的是纯数字索引，尝试从历史记录中匹配
        if (/^\d+$/.test(targetPath)) {
            const index = parseInt(targetPath, 10) - 1;
            const history = await sql((data) => data.cdHistory || []);
            const topHistory = [...history].sort((a, b) => b.count - a.count).slice(0, 10);

            if (index >= 0 && index < topHistory.length) {
                targetPath = topHistory[index].path;
            } else {
                // 如果索引超出范围，我们不直接退出，而是尝试把它当作一个名为数字的目录
                // （这符合原生 cd 命令的回退机制）
            }
        }

        // Resolve absolute path
        const absolutePath = path.resolve(process.cwd(), targetPath);

        // Check if valid directory
        if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isDirectory()) {
            process.stderr.write(`错误: 路径不存在或不是一个目录 -> ${absolutePath}\n`);
            process.exit(1);
        }

        // Update database and print
        await updateHistoryAndPrint(absolutePath);
    } else {
        // No path provided, show index list
        const history = await sql((data) => data.cdHistory || []);
        if (history.length === 0) {
            process.stderr.write('当前无目录跳转历史记录\n');
            process.exit(1);
        }

        // Sort by count descending and take top 10
        const topHistory = [...history].sort((a, b) => b.count - a.count).slice(0, 10);

        console.log('请使用 `mycli cd <序号>` 跳转到以下历史目录:\n');
        topHistory.forEach((item, index) => {
            console.log(`  [${index + 1}] ${item.path} (访问次数: ${item.count})`);
        });
    }
}

async function updateHistoryAndPrint(absolutePath: string) {
    await sql((data) => {
        if (!data.cdHistory) {
            data.cdHistory = [];
        }

        const existing = data.cdHistory.find((item) => item.path === absolutePath);
        if (existing) {
            existing.count += 1;
        } else {
            data.cdHistory.push({
                path: absolutePath,
                count: 1,
            });
        }
        // returning undefined will automatically trigger db.write() in operateJsonDatabase
    });

    // Write the target path to a temporary file for the shell wrapper to read
    const tempFile = path.join(os.tmpdir(), '.mycli_cd_path');
    fs.writeFileSync(tempFile, absolutePath, 'utf8');

    // Also output to stdout for visibility
    console.log(`准备跳转到: ${absolutePath}`);
}
