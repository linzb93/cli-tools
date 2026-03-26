import React from 'react';
import { render } from 'ink';
import { ScanApp } from '@/components/scan/ScanApp';
import type { Options as ScanOptions } from '@/business/git/scan';
import { subCommandCompiler } from '@/utils';

/**
 * git scan 子命令的实现
 */
export const scanCommand = () => {
    subCommandCompiler((program) => {
        program
            .command('scan')
            .description('扫描Git分支')
            .option('--full', '是否全量扫描')
            .action((options: ScanOptions) => {
                const app = render(React.createElement(ScanApp, { options }));
                app.waitUntilExit();
            });
    });
};
