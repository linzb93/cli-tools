import { ask } from '@/utils/readline';
import { open } from '@/utils/web';
import { useAI } from '@/utils/ai/implementation';
import { logger } from '@/utils/logger';
import { readSecret } from '@cli-tools/shared';
import { imageBase64ToStream, tempUpload } from '@/utils/image';
import { service } from '@/utils/http/company-service';

/**
 * 手动输入验证码进行登录
 * @param username 用户名
 * @param password 密码
 * @param prefix API前缀
 * @returns 登录结果
 */
async function manualCaptchaLogin(
    username: string,
    password: string,
    prefix: string,
): Promise<{
    token: string;
}> {
    const { url, uuid, removeHandler } = await getLoginCaptcha();
    logger.info(`请在浏览器中打开以下地址查看验证码：${url}`);
    await open(url);

    const code = await ask('请输入验证码:');
    const res = await service.post(`${prefix}/login`, {
        username,
        password,
        uuid,
        code,
    });

    removeHandler();
    return res.data;
}

export async function login(): Promise<void> {
    try {
        let { username } = await readSecret((db) => db.oa);
        if (!username) {
            await getOCCUserInfo();
        }
        const oa = await readSecret((db) => db.oa);
        username = oa.username;
        const password = oa.password;
        const prefix = oa.apiPrefix;

        let loginSuccess = false;
        let retryCount = 0;
        const maxRetries = 5;
        let loginResult: {
            token: string;
        };

        // 正常流程：先尝试AI识别，失败后使用手动输入
        while (!loginSuccess && retryCount < maxRetries) {
            try {
                // 获取验证码并登录
                loginResult = await processCaptchaAndLogin(username, password, prefix);
                if (loginResult && loginResult.token) {
                    loginSuccess = true;
                } else {
                    retryCount++;
                    logger.error(`登录失败，正在重试 (${retryCount}/${maxRetries})...`);
                }
            } catch (error) {
                retryCount++;
                logger.error(`验证码识别失败，正在重试 (${retryCount}/${maxRetries})...`);
            }
        }

        // 如果AI识别失败5次，则让用户手动输入
        if (!loginSuccess) {
            logger.error('验证码自动识别失败，请手动输入验证码');
            loginResult = await manualCaptchaLogin(username, password, prefix);
        }

        // 保存token
        await readSecret((db) => {
            db.oa.token = loginResult.token;
        });
    } catch (error) {
        logger.error(`登录过程中发生错误: ${(error as Error).message}`, true);
    }
}

async function getOCCUserInfo() {
    const username = await ask('请输入用户名:');
    const password = await ask('请输入密码:');

    await readSecret((db) => {
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
    prefix: string,
): Promise<{
    token: string;
}> {
    const { url, uuid, removeHandler } = await getLoginCaptcha();

    try {
        const ocrResult = await useAI(
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
            },
        );
        if (!Number.isInteger(Number(ocrResult))) {
            throw new Error(`错误的识别结果：${ocrResult}`);
        } else {
            logger.info(`识别结果：${ocrResult}`);
        }
        removeHandler();
        const res = await service.post(`${prefix}/login`, {
            username,
            password,
            uuid,
            code: ocrResult.contents,
        });
        return res;
    } catch (error) {
        removeHandler();
        if (process.env.MODE === 'cliTest') {
            logger.error((error as Error).message);
        }
        throw error;
    }
}

async function getLoginCaptcha(): Promise<{
    url: string;
    uuid: string;
    removeHandler: () => Promise<void>;
}> {
    const prefix = await readSecret((db) => db.oa.apiPrefix);
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
    const { img, uuid } = res;
    const stream = imageBase64ToStream(img);
    const { url, removeHandler } = await tempUpload({
        type: 'stream',
        data: stream,
    });
    return { url, uuid, removeHandler };
}
