import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useApp } from 'ink';
import SelectInput from 'ink-select-input';
import chalk from 'chalk';
import { basename } from 'node:path';
import { scanService } from '@/business/git/scan';
import { GitStatusMap } from '@/business/git/shared/utils';
import type { Options, ResultItem } from '@/business/git/scan/types';

type Phase = 'scanning' | 'completed' | 'interactive';

interface MenuItem {
    label: string;
    value: string;
}

/**
 * 简单的进度条组件
 */
const ProgressBar: React.FC<{ percent: number; width?: number }> = ({ percent, width = 40 }) => {
    const filled = Math.round(percent * width);
    const empty = width - filled;
    return (
        <Text>
            <Text color="green">{'\u2588'.repeat(filled)}</Text>
            <Text dimColor>{'\u2591'.repeat(empty)}</Text>
            <Text> {Math.round(percent * 100)}%</Text>
        </Text>
    );
};

/**
 * 获取状态对应的显示文本
 */
const getStatusText = (status: number): string => {
    const map: Record<number, string> = {
        [GitStatusMap.Uncommitted]: '未提交',
        [GitStatusMap.Unpushed]: '未推送',
        [GitStatusMap.Pushed]: '正常',
        [GitStatusMap.NotOnMainBranch]: '不在主分支上',
    };
    return map[status] || String(status);
};

/**
 * git scan 主组件
 * 管理扫描进度、表格展示和交互选择状态
 */
export const ScanApp: React.FC<{ options: Options }> = ({ options }) => {
    const [phase, setPhase] = useState<Phase>('scanning');
    const [progress, setProgress] = useState(0);
    const [current, setCurrent] = useState(0);
    const [total, setTotal] = useState(0);
    const [list, setList] = useState<ResultItem[]>([]);
    const { exit } = useApp();

    // 开始扫描
    useEffect(() => {
        scanService(options, {
            onTotal: (t) => setTotal(t),
            onProgress: (curr, tot) => {
                setCurrent(curr);
                setProgress(tot > 0 ? curr / tot : 0);
            },
            onComplete: (result) => {
                setList(result);
                setPhase(result.length === 0 ? 'completed' : 'interactive');
            },
        });
    }, [options]);

    // 处理菜单选择
    const handleSelect = useCallback(
        async (item: MenuItem) => {
            switch (item.value) {
                case 'exit':
                    exit();
                    break;
                case 'restart':
                    setPhase('scanning');
                    setProgress(0);
                    setCurrent(0);
                    setTotal(0);
                    break;
                case 'diff':
                case 'commit':
                case 'log':
                case 'push':
                    // 这些命令需要先选择项目，暂不支持
                    console.log(chalk.yellow('请先使用数字键选择项目'));
                    break;
            }
        },
        [list, exit],
    );

    // 扫描阶段
    if (phase === 'scanning') {
        return (
            <Box flexDirection="column">
                <Text>扫描中 ({current}/{total})...</Text>
                <ProgressBar percent={progress} />
            </Box>
        );
    }

    // 无项目阶段
    if (phase === 'completed') {
        return <Text bold>{chalk.green('恭喜！没有项目需要提交或推送。')}</Text>;
    }

    // 交互阶段：显示表格 + 菜单
    const menuItems: MenuItem[] = [
        { label: '查看 diff (1)', value: 'diff' },
        { label: '提交代码 (2)', value: 'commit' },
        { label: '查看日志 (3)', value: 'log' },
        { label: '推送代码 (4)', value: 'push' },
        { label: '重新扫描 (5)', value: 'restart' },
        { label: '退出 (6)', value: 'exit' },
    ];

    return (
        <Box flexDirection="column">
            <Text bold>项目列表:</Text>
            {list.map((item, i) => (
                <Box key={item.path} flexDirection="column" marginLeft={2}>
                    <Text>
                        <Text bold>{i + 1}. </Text>
                        <Text dimColor>路径: </Text>
                        <Text>{basename(item.path)}</Text>
                    </Text>
                    <Box flexDirection="row" marginLeft={2}>
                        <Text dimColor>状态: </Text>
                        <Text>{getStatusText(item.status)}</Text>
                        <Text dimColor>  分支: </Text>
                        <Text>{item.branchName}</Text>
                    </Box>
                </Box>
            ))}
            <Box marginTop={1}>
                <Text bold>选择操作:</Text>
            </Box>
            <SelectInput items={menuItems} onSelect={handleSelect} />
        </Box>
    );
};

export default ScanApp;
