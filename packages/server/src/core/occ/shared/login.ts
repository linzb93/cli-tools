import sql from '@/utils/sql';
import inquirer from '@/utils/inquirer';
import chalk from 'chalk';
import open from 'open';
import AiImpl from '@/core/ai/shared/ai-impl';
import { imageBase64ToStream, tempUpload } from '@/utils/image';
import serviceGenerator from '@/utils/http';
const service = serviceGenerator({
    baseURL: '',
});
export async function login(): Promise<void> {
    try {
        let { username } = await sql((db) => db.oa);
        if (!username) {
            await getOCCUserInfo();
        }
        username = await sql((db) => db.oa.username);
        const password = await sql((db) => db.oa.password);
        const prefix = await sql((db) => db.oa.apiPrefix);

        let loginSuccess = false;
        let retryCount = 0;
        const maxRetries = 5;
        let loginResult: {
            token: string;
        };

        while (!loginSuccess && retryCount < maxRetries) {
            try {
                // 获取验证码并登录
                loginResult = await processCaptchaAndLogin(username, password, prefix);
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

            const { url, uuid, removeHandler } = await getLoginCaptcha();
            console.log(chalk.green('请在浏览器中打开以下地址查看验证码：'));
            await open(url);

            const { code } = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'code',
                    message: '请输入验证码:',
                },
            ]);

            const res = await this.service.post(`${prefix}/login`, {
                username,
                password,
                uuid,
                code,
            });

            loginResult = res.data;
            removeHandler();
        }

        // 保存token
        await sql((db) => {
            db.oa.token = loginResult.token;
        });
    } catch (error) {
        console.error(chalk.red('登录过程中发生错误:'), error.message);
        process.exit(0);
    }
}

async function getOCCUserInfo() {
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
/**
 * 获取验证码并登录
 * @param username 用户名
 * @param password 密码
 * @param prefix API前缀
 * @returns 登录结果
 */
async function processCaptchaAndLogin(
    username: string,
    password: string,
    prefix: string
): Promise<{
    token: string;
}> {
    const { url, uuid, removeHandler } = await getLoginCaptcha();

    try {
        const ocrResult = await new AiImpl().use(
            [
                {
                    role: 'assistant',
                    content: '请根据图片内容，识别出图片中的算式验证码，并返回算式验证码的结果，不要返回任何其他内容',
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
        const res = await service.post<
            {
                token: string;
                code: number;
            },
            any,
            {
                username: string;
                password: string;
                uuid: string;
                code: string;
            }
        >(`${prefix}/login`, {
            username,
            password,
            uuid,
            code: ocrResult,
        });
        return res.data;
    } catch (error) {
        removeHandler();
        if (process.env.DEBUG) {
            console.log(error.message);
        }
        throw error;
    }
}
async function getLoginCaptcha(): Promise<{
    url: string;
    uuid: string;
    removeHandler: () => Promise<void>;
}> {
    const prefix = await sql((db) => db.oa.apiPrefix);
    const res = await service.get<{
        /**
         * 验证码base64，不含前面`data:image/png;base64,`
         */
        img: string;
        /**
         * 验证码uuid，用于登录
         */
        uuid: string;
    }>(`${prefix}/captchaImage`);
    const { img, uuid } = res.data;
    const stream = imageBase64ToStream(img);
    const { url, removeHandler } = await tempUpload({
        type: 'stream',
        data: stream,
    });
    return { url, uuid, removeHandler };
}
