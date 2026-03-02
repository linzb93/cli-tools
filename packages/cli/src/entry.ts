#!/usr/bin/env node
import axios from 'axios';
if (Number(process.version.split('.')[0].replace('v', '')) < 20) {
    axios
        .post('http://localhost:7001', {
            path: 'nvm-switch',
            query: {
                version: '20',
            },
        })
        .then(() => {
            import('./cli.js');
        })
        .catch(() => {
            console.error('请升级 Node.js 到 20 以上版本');
            process.exit(1);
        });
} else {
    import('./cli.js');
}
