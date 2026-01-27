import BaseService from '../../core/BaseService.abstract';
import npm from '../shared';

export interface Options {
    dev?: boolean;
    help?: boolean;
}
export class HasService extends BaseService {
    async main(args: string[], options: Options) {
        const { spinner } = this;
        const name = args[0];
        this.spinner.text = '正在查找';
        const listRet = await npm.getList(name);
        if (!listRet.list.length) {
            if (process.env.VITEST) {
                return false;
            }
            await this.handleNotFound(name, options.dev);
            return;
        }
        if (listRet.list.length === 1) {
            if (process.env.VITEST) {
                return true;
            }
            spinner.succeed(`${name}存在，版本号是${listRet.versionList[0]}`);
            return;
        }
        spinner.succeed('发现有多个符合条件的依赖:');
        listRet.versionList.forEach((text) => {
            console.log(`${text}`);
        });
    }
    private async handleNotFound(name: string, dev?: boolean) {
        // const { action } = await this.inquirer.prompt({
        //   type: "confirm",
        //   name: "action",
        //   message: `${name} 不存在，是否安装？`,
        // });
        // this.spinner.stop();
    }
}
