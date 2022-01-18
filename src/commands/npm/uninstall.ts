import inquirer from 'inquirer';
import del from 'del';
import path from 'path';
import globalNpm from 'global-modules';
import readPkg from 'read-pkg';
import getNpmList, {getVersion} from './util/getList';
import logger from '../../util/logger';
import BaseCommand from '../../util/BaseCommand';

export default class extends BaseCommand {
    private args:any;
    private options:any;
    constructor(args, options) {
        super();
        this.args=args;
        this.options=options;
    }
    async run() {
        const {args,options} = this;
        const name = args[0];
        if (options.global) {
            await delGlobal(name);
            logger.success('删除成功');
            return;
        }
        const listRet = await getNpmList(name);
        if (!listRet.list.length) {
            logger.error('没找到，无法删除');
            return;
        }
        if (listRet.list.length === 1) {
            await del(`node_modules/${listRet.list[0]}`);
            logger.success('删除成功');
            return;
        }
        const ans = await inquirer.prompt([{
            message: '发现有多个符合条件的依赖，请选择其中需要删除的',
            type: 'checkbox',
            name: 'ret',
            choices: listRet.list.map(item => ({
                name: getVersion(item),
                value: item
            }))
        }]);
        try {
            for (const pkg of ans.ret) {
                await del(`node_modules/${pkg}`);
            }
        } catch (error) {
            logger.error(error);
            return;
        }
        logger.success('删除成功');
    };
}

// 除了删除全局的文件，还要删除全局命令
async function delGlobal(name) {
    let pkg;
    try {
        pkg = await readPkg({
            cwd: path.resolve(globalNpm, 'node_modules', name)
        });
    } catch (error) {
        const similarNpm = await getSimilar(name);
        if ((similarNpm as SimilarOption).name) {
            const { action } = await inquirer.prompt([{
                type: 'confirm',
                message: `${name}不存在，你想删除的是${(similarNpm as SimilarOption).name}吗？`,
                default: true,
                name: 'action'
            }]);
            if (action) {
                pkg = await readPkg({
                    cwd: path.resolve(globalNpm, 'node_modules', (similarNpm as SimilarOption).name)
                });
                const cmds = pkg.bin ? Object.keys(pkg.bin) : [];
                await del((similarNpm as SimilarOption).name, {
                    cwd: path.resolve(globalNpm, 'node_modules')
                });
                for (const cmd of cmds) {
                    await del([ cmd, `${cmd}.cmd`, `${cmd}.ps1` ], {
                        cwd: globalNpm
                    });
                }
            }
        } else {
            logger.error('模块不存在');
            process.exit(1);
        }
    }
    const cmds = pkg.bin ? Object.keys(pkg.bin) : [];
    await del(name, {
        cwd: path.resolve(globalNpm, 'node_modules')
    });
    for (const cmd of cmds) {
        await del([ cmd, `${cmd}.cmd`, `${cmd}.ps1` ], {
            cwd: globalNpm
        });
    }
}
interface SimilarOption {
    name: string
}
async function getSimilar(name:string):Promise<SimilarOption | Boolean> {
    const similarNpm = `@${name.replace('-', '/')}`;
    if (similarNpm === `@${name}`) {
        return false;
    }
    try {
        await readPkg({
            cwd: path.resolve(globalNpm, 'node_modules', similarNpm)
        });
        return {
            name: similarNpm
        };
    } catch (error) {
        return false;
    }
}
