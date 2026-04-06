import React from 'react';
import { render } from 'ink';
import Table, { Header, Cell, Skeleton } from '../src/lib/Table';

const tableData = [
    { index: 1, name: '项目1', status: '正常', branch: 'main' },
    { index: 2, name: '项目2', status: '异常', branch: 'dev' },
    { index: 3, name: '项目3', status: '未知', branch: 'master' },
];
function App() {
    return (
        <Table
            data={tableData}
            columns={['index', 'name', 'status', 'branch']}
            padding={1}
            header={Header}
            cell={Cell}
            skeleton={Skeleton}
        />
    );
}
render(<App />);
