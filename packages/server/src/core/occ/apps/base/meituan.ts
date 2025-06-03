import Base from './';
import serviceGenerator from '@/utils/http';
import inquirer from '@/utils/inquirer';
import sql from '@/utils/sql';
import spinner from '@/utils/spinner';
import open from 'open';
import chalk from 'chalk';
import AiImpl from '@/core/ai/shared/ai-impl';
import { imageBase64ToStream, tempUpload } from '@/utils/image';
import { Options } from '../../types';
export default abstract class Meituan extends Base {
    /**
     * appKey，各应用不一样
     */
    abstract appKey: string;
    /**
     * 平台值
     */
    platform = 8;
    searchKey = 'param';
    service = serviceGenerator({
        baseURL: '',
    });
    async getByVersion(version: number, shopName: string) {
        try {
            let { token } = await sql((db) => db.oa);
            if (!token) {
                await this.login();
                return this.getByVersion(version, shopName);
            }
            token = await sql((db) => db.oa.token);
            let realVersion = version;
            if (version === 0) {
                realVersion = 2;
            } else if (version === 1) {
                realVersion = 1;
            } else if (version === 2) {
                realVersion = 1;
            } else if (version === 3) {
                realVersion = 2;
            }
            spinner.fail(
                `${chalk.yellow(`【${this.serviceName}】`)}当前应用不支持PC端功能，请使用移动端访问店铺【${shopName}】`
            );
            const prefix = await sql((db) => db.oa.apiPrefix);
            const res = await this.service.post(
                `${prefix}/query/businessInfoList`,
                {
                    pageIndex: 1,
                    pageSize: 10,
                    memberId: '',
                    timeType: 1,
                    startTime: '',
                    endTime: '',
                    minPrice: '',
                    maxPrice: '',
                    minOrderTimes: '',
                    maxOrderTimes: '',
                    param: '',
                    remarks: '',
                    appKey: this.appKey,
                    type: '0',
                    customerType: 0,
                    customerClassify: 0,
                    version: realVersion,
                    distributionStatus: 0,
                    payStatus: 0,
                    loginer: '',
                    orderType: 0,
                    sortType: 0,
                },
                {
                    headers: {
                        token,
                    },
                }
            );
            if (res.data.code !== 200) {
                await this.login();
                return this.getByVersion(version, shopName);
            }
            process.exit(0);
        } catch (error) {
            console.error(chalk.red('获取版本信息时发生错误:'), error.message);
            process.exit(1);
        }
    }
    async login() {
        try {
            let { username } = await sql((db) => db.oa);
            if (!username) {
                await this.getOCCUserInfo();
            }
            username = await sql((db) => db.oa.username);
            const password = await sql((db) => db.oa.password);
            const prefix = await sql((db) => db.oa.apiPrefix);

            let loginSuccess = false;
            let retryCount = 0;
            const maxRetries = 5;
            let loginResult;

            while (!loginSuccess && retryCount < maxRetries) {
                try {
                    // 获取验证码并登录
                    loginResult = await this.processCaptchaAndLogin(username, password, prefix);
                    console.log(loginResult);
                    if (loginResult && loginResult.token) {
                        loginSuccess = true;
                    } else {
                        retryCount++;
                        console.log(chalk.yellow(`登录失败，正在重试 (${retryCount}/${maxRetries})...`));
                    }
                } catch (error) {
                    retryCount++;
                    console.log(chalk.yellow(`验证码识别失败，正在重试 (${retryCount}/${maxRetries})...`));
                }
            }

            // 如果AI识别失败5次，则让用户手动输入
            if (!loginSuccess) {
                console.log(chalk.red('验证码自动识别失败，请手动输入验证码'));

                const res = await this.service.get(`${prefix}/captchaImage`);
                const { img, uuid } = res.data;

                // 生成一个临时文件URL用于浏览器打开
                const imageUrl = `data:image/png;base64,${img}`;
                console.log(chalk.green('请在浏览器中打开以下地址查看验证码：'));
                await open(imageUrl);

                const { code } = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'code',
                        message: '请输入验证码:',
                    },
                ]);

                const res2 = await this.service.post('/login', {
                    username,
                    password,
                    uuid,
                    code,
                });

                loginResult = res2.data.result;
            }

            // 保存token
            await sql((db) => {
                db.oa.token = loginResult.token;
            });
            const token = await sql((db) => db.oa.token);
            return token;
        } catch (error) {
            console.error(chalk.red('登录过程中发生错误:'), error.message);
            process.exit(1);
        }
    }
    override async search(keyword: string, options: Options) {
        if (options.version) {
            const token = await this.getByVersion(options.version, keyword);
            console.log(token);
            return token;
        }
        const url = await this.getShopUrl(keyword, options.test);
        await this.afterSearch(url, keyword, options);
    }

    /**
     * 获取验证码并登录
     * @param username 用户名
     * @param password 密码
     * @param prefix API前缀
     * @returns 登录结果
     */
    async processCaptchaAndLogin(username: string, password: string, prefix: string) {
        const res = await this.service.get(`${prefix}/captchaImage`);
        const { img, uuid } = res.data;
        const stream = imageBase64ToStream(img);
        const { url, removeHandler } = await tempUpload({
            type: 'stream',
            data: stream,
        });
        try {
            const ocrResult = await new AiImpl().use(
                [
                    {
                        role: 'assistant',
                        content:
                            '请根据图片内容，识别出图片中的算式验证码，并返回算式验证码的结果，不要返回任何其他内容',
                    },
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'image_url',
                                image_url: {
                                    url,
                                },
                            },
                        ],
                    },
                ],
                {
                    type: 'image',
                }
            );
            if (!Number.isInteger(Number(ocrResult))) {
                throw new Error(`错误的识别结果：${ocrResult}`);
            } else {
                console.log(`识别结果：${ocrResult}`);
            }
            removeHandler();
            const res2 = await this.service.post(`${prefix}/login`, {
                username,
                password,
                uuid,
                code: ocrResult,
            });
            return res2.data;
        } catch (error) {
            removeHandler();
            if (process.env.DEBUG) {
                console.log(error.message);
            }
            throw error;
        }
    }
    async getShopUrl(keyword: string, isTest: boolean): Promise<string> {
        return this.getMeituanShopUrl(
            {
                appKey: this.appKey,
                memberId: keyword,
                platform: this.platform,
            },
            isTest
        );
    }
    async getUserInfo(token: string, isTest: boolean): Promise<string> {
        return this.getMeituanUserInfo(token, isTest);
    }
    private async getMeituanUserInfo(token: string, isTest: boolean) {
        const prefix = await this.getPrefix(isTest);
        const res = await this.service.post(
            `${prefix}/meituan/homeUserInfo`,
            {},
            {
                headers: {
                    token,
                },
            }
        );
        return res.data;
    }
    private async getMeituanShopUrl(params: any, isTest: boolean) {
        const prefix = await this.getPrefix(isTest);
        const res = await this.service.post(`${prefix}/occ/order/replaceUserLogin`, params);
        return res.data.result;
    }
    private async getPrefix(isTest: boolean) {
        return await sql((db) => (isTest ? db.oa.testPrefix : db.oa.apiPrefix));
    }
    private async getOCCUserInfo() {
        const { username, password } = await inquirer.prompt([
            {
                type: 'input',
                name: 'username',
                message: '请输入用户名',
            },
            {
                type: 'input',
                name: 'password',
                message: '请输入密码',
            },
        ]);
        await sql((db) => {
            db.oa.username = username;
            db.oa.password = password;
        });
    }
}
