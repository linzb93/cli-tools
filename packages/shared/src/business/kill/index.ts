import rawKillPort from 'kill-port';
import detectPort from 'detect-port';
import { last, isPlainObject } from 'lodash-es';
import chalk from 'chalk';
import { BaseService } from '@cli-tools/shared/base/BaseService';

const numberRE = /[1-9][0-9]*/;

export interface IOption {
    /**
     * 是否打印日志
     * @default true
     * */
    log: boolean;
}

export type Params = [number] | [string, number];
export class KillService extends BaseService {
    private options: IOption = {
        log: true,
    };
    async main(...args: any[]) {
        if ((args.length === 2 && isPlainObject(args[1])) || (args.length === 3 && isPlainObject(args[2]))) {
            this.options = last(args);
        }
        if (!(await this.validate(args))) {
            return;
        }
        let type = 'pid';
        let num = 0;
        if (typeof args[0] === 'number') {
            type = 'port';
            num = args[0];
        } else if (args[0] === 'pid') {
            num = args[1];
        } else if (args[0] === 'port') {
            num = args[1];
            type = 'port';
        }
        if (type === 'port') {
            this.killPort(num.toString());
            return;
        }
        this.killProcess(num);
    }
    /**
     * 校验参数合法性
     */
    async validate(args: any): Promise<boolean> {
        const num = typeof args[0] === 'number' ? args[0] : args[1];
        if (!numberRE.test(num.toString())) {
            this.logger.error('端口号格式不正确，只能输入数字');
            return false;
        }
        if (num < 1000) {
            this.logger.error('请输入1000以上的进程ID或端口号');
            return false;
        }
        if ((await detectPort(num)) === num) {
            if (this.options.log) {
                this.logger.warn('进程未被占用，无需解除');
            }
            return false;
        }
        return true;
    }
    /**
     * 退出进程
     */
    killProcess(id: number) {
        try {
            process.kill(id);
            if (this.options.log) {
                this.logger.success(`进程ID为${chalk.yellow(id)}的进程关闭成功`);
            }
        } catch (error) {
            if (this.options.log) {
                this.logger.error(`不存在进程ID为 ${chalk.yellow(id)} 的进程`);
            }
        }
    }

    /**
     * 退出端口进程，需要做error处理
     * @param port
     * @returns
     */
    private async killPort(port: string) {
        const { options } = this;
        try {
            await this.killPortAction(port);
            if (options.log) {
                this.logger.success(`端口号为${chalk.yellow(port)}的进程关闭成功`);
            }
        } catch (error) {
            if (options.log) {
                this.logger.error(`端口号为${chalk.yellow(port)}的进程关闭失败`);
            }
        }
    }
    private async killPortAction(port: string) {
        return new Promise((resolve, reject) => {
            rawKillPort(port, 'tcp')
                .then(async (data) => {
                    if (data.stderr) {
                        const newPort = await detectPort(Number(port));
                        if (Number(port) !== newPort) {
                            reject('端口已被占用');
                        } else {
                            resolve(null);
                        }
                    } else {
                        resolve(null);
                    }
                })
                .catch(reject);
        });
    }
}
