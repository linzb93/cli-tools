import { join } from 'node:path';
import fsp from 'node:fs/promises';
import React, { useState, useEffect } from 'react';
import { Box, render, Text, useApp } from 'ink';
// import SelectInput from 'ink-select-input';
// import TextInput from 'ink-text-input';
import Table, { Header, Skeleton, Cell } from '@/lib/Table';
import pMap from 'p-map';
import pReduce from 'p-reduce';
import { sql } from '@cli-tools/shared';
import { getGitProjectStatus, GitStatusMap } from '../shared/utils';
import type { InputItem, ResultItem } from './types';
import ProgressBar from '@/lib/ProgressBar';

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
        for (const item of list) {
            try {
                const { status, branchName } = await getGitProjectStatus(item.fullPath);
                setResultList((prev) =>
                    prev.concat({
                        ...item,
                        status,
                        branchName,
                    }),
                );
            } catch (error) {
                // 如果获取状态失败，返回一个默认状态或者忽略
                setResultList((prev) =>
                    prev.concat({
                        ...item,
                        status: 3, // 默认为正常，避免中断流程
                        branchName: '',
                    }),
                );
            } finally {
                // 扫描完成后，进度增加1，使用函数式更新避免闭包问题
                setProgress((prev) => prev + 1);
            }
        }
        setLoading(false);
    };
    return (
        <Box>
            {loading ? (
                <Box>
                    <Text>
                        {progress}/{list.length}
                    </Text>
                    <ProgressBar columns={14} percent={progress / list.length} left={1} />
                </Box>
            ) : (
                <Table
                    data={resultList.map((item, i) => ({
                        ...item,
                        index: i + 1,
                        statusName: GitStatusMap[item.status],
                    }))}
                    columns={['index', 'fullPath', 'statusName', 'branchName']}
                    padding={1}
                    header={Header}
                    cell={Cell}
                    skeleton={Skeleton}
                />
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
