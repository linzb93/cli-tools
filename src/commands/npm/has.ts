import inquirer from 'inquirer';
import ora from 'ora';
import getNpmList from './util/getList';
import NpmInstall from './install.js';
import BaseCommand from '../../util/BaseCommand';

export default class extends BaseCommand {
    private args: any;
    private flag: any;
    constructor(args, flag) {
        super()
        this.args = args;
        this.flag = flag;
    }
    async run() {
        const { args, flag } = this;
        const name = args[0];
        const spinner = ora('正在查找').start();
        const listRet = await getNpmList(name);
        if (!listRet.list.length) {
            handleNotFound(name, flag.dev);
            return;
        }
        if (listRet.list.length === 1) {
            spinner.succeed(`${name}存在，版本号是${listRet.versionList[0]}`);
            return;
        }
        spinner.succeed('发现有多个符合条件的依赖:');
        listRet.versionList.forEach(text => {
            console.log(`${text}`);
        });

        async function handleNotFound(name, dev) {
            spinner.stop();
            const { action } = await inquirer.prompt({
                type: 'confirm',
                name: 'action',
                message: `${name} 不存在，是否安装？`
            });
            if (action) {
                await new NpmInstall([name], { dev }).run();
            }
        }
    };
}
