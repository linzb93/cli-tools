import { join } from 'node:path';
import fsp from 'node:fs/promises';
import React, { useState, useEffect } from 'react';
import { Box, render, Text, useApp, Newline } from 'ink';
// import SelectInput from 'ink-select-input';
// import TextInput from 'ink-text-input';
import Table, { Skeleton, Cell } from '@/lib/Table';
import pMap from 'p-map';
import pReduce from 'p-reduce';
import chalk from 'chalk';
import { sql } from '@cli-tools/shared';
import { getGitProjectStatus, GitStatusMap } from '../shared/utils';
import type { InputItem, ResultItem } from './types';
import ProgressBar from '@/lib/ProgressBar';

/** 中文状态名，带颜色 */
const StatusName: Record<number, string> = {
    [GitStatusMap.Unknown]: '未知',
    [GitStatusMap.Uncommitted]: chalk.red('未提交'),
    [GitStatusMap.Unpushed]: chalk.yellow('未推送'),
    [GitStatusMap.Pushed]: '已推送',
    [GitStatusMap.NotOnMainBranch]: '不在主分支',
};

const App = ({ list }: { list: InputItem[] }) => {
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(true);
    const [resultList, setResultList] = useState<ResultItem[]>([]);
    useEffect(() => {
        doScan();
    }, []);
    /**
     * 执行扫描并返回异常的项目列表
     * @returns {Promise<void>} 无返回值
     */
    const doScan = async (): Promise<void> => {
        const results: ResultItem[] = [];
        const data = await pMap(
            list,
            async (item) => {
                try {
                    const { status, branchName } = await getGitProjectStatus(item.fullPath);
                    setProgress((data) => data + 1);
                    return { ...item, status, branchName } as ResultItem;
                } catch (error) {
                    // 如果获取状态失败，返回一个默认状态或者忽略
                    return { ...item, status: 3, branchName: '' } as ResultItem;
                }
            },
            {
                concurrency: 4,
            },
        );
        setResultList(data.filter((item) => [1, 2].includes(item.status)));
        setLoading(false);
    };
    return (
        <Box>
            {loading ? (
                <Box>
                    <Box>
                        <Text>
                            {progress}/{list.length}
                        </Text>
                    </Box>
                    <ProgressBar columns={14} percent={progress / list.length} left={1} />
                </Box>
            ) : (
                <Box>
                    <Box marginBottom={4}>
                        <Text>已扫描{list.length}个项目</Text>
                    </Box>
                    <Newline />
                    <Box>
                        <Newline />
                        <Table
                            data={resultList.map((item, i) => ({
                                fullPath: item.fullPath,
                                index: i + 1,
                                statusName: StatusName[item.status],
                            }))}
                            columns={['index', 'fullPath', 'statusName']}
                            padding={1}
                            cell={Cell}
                            skeleton={Skeleton}
                        />
                    </Box>
                </Box>
            )}
        </Box>
    );
};

/**
 * 遍历待扫描的项目列表
 * @returns {Promise<InputItem[]>} 待扫描的项目列表
 */
const getInputItems = async (): Promise<InputItem[]> => {
    const gitDirs = await sql(async (db) => db.gitDirs);
    return await pReduce(
        gitDirs,
        async (acc, dir) => {
            try {
                const dirs = await fsp.readdir(dir.path);
                return acc.concat(
                    await pMap(
                        dirs,
                        async (subDir) => ({
                            fullPath: join(dir.path, subDir),
                        }),
                        { concurrency: 4 },
                    ),
                );
            } catch (error) {
                // 如果目录不存在或无法读取，跳过
                return acc;
            }
        },
        [] as InputItem[],
    );
};

/**
 * 扫描Git项目服务
 * @param options - 扫描选项
 * @param callbacks - 进度回调
 */
export const scanService = async () => {
    const list = await getInputItems();
    render(<App list={list} />);
};
