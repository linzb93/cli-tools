const open = require('open');
const fs = require('fs-extra');
const logger = require('../lib/logger');
const inquirer = require('inquirer');
module.exports = async type => {
    // mycli proj psd api yx
    const data = await fs.readJSON('project/db.json');
    if (type === 'set') {
        const { name } = await inquirer.prompt([
            {
                type: 'list',
                name: 'name',
                message: '请选择设为默认的项目',
                choices: data.items.map(item => item.name)
            }
        ]);
        const match = data.items.find(item => item.name === name);
        data.current = match.id;
        fs.writeJSON(data);
        return;
    }
    if (![ 'psd', 'yx', 'api' ].includes(type)) {
        logger.error('未知命令');
        return;
    }
    const match = data.items.find(item => item.id === data.current);
    open(match[type]);
};
