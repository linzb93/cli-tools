import open from 'open';
import readPkg from 'read-pkg';
import sql from './sql';
import { readSecret } from './secret';
// import puppeteer from 'puppeteer';
// import readline from 'readline';

interface JenkinsProject {
    name: string;
    id: string;
}

/**
 * 打开公司内部Jenkins部署页面
 */
export const openDeployPage = async (type?: string) => {
    const { id, name } = await getProjectName(type);
    if (id) {
        const isWork = true;
        const origin = await readSecret((db) => (isWork ? db.jenkins.url.internal : db.jenkins.url.public));
        await open(`http://${origin}/view/${name}/job/${id}/`);
    }
};

/**
 * 根据项目package.json中的jenkins属性值获取对应jenkins信息
 */
export const getProjectName = async (
    type?: string
): Promise<{
    name: string;
    id: string;
    onlineId?: string;
}> => {
    const projectConf = await readPkg({
        cwd: process.cwd(),
    });
    const finded = projectConf.jenkins;
    if (Array.isArray(finded)) {
        const jenkins = type
            ? (finded.find((item) => item.type === type) as JenkinsProject)
            : (finded[0] as JenkinsProject);
        if (!jenkins) {
            return {
                name: '',
                id: '',
            };
        }
        return {
            ...jenkins,
            onlineId: jenkins.id.replace(/[\-|_]test$/, ''),
        };
    }
    const jenkins = finded as JenkinsProject;
    if (!jenkins) {
        return {
            name: '',
            id: '',
        };
    }
    return {
        ...jenkins,
        onlineId: jenkins.id.replace(/[\-|_]test$/, ''),
    };
};

/**
 * 请求用户输入信息
 * @param question 问题提示
 * @returns 用户输入的内容
 */
const askUser = (question: string): Promise<string> => {
    // const rl = readline.createInterface({
    //     input: process.stdin,
    //     output: process.stdout,
    // });

    // return new Promise((resolve) => {
    //     rl.question(question, (answer) => {
    //         rl.close();
    //         resolve(answer);
    //     });
    // });
    return Promise.resolve('');
};

/**
 * 自动化Jenkins部署流程
 * @param branch 要部署的分支名称，如果需要在部署过程中选择分支
 * @returns 部署是否成功
 */
// export const autoDeploy = async (branch?: string): Promise<boolean> => {
//     try {
//         // 获取项目信息和Jenkins URL
//         const { id, name } = await getProjectName();
//         if (!id || !name) {
//             console.error('未找到Jenkins项目信息，请在package.json中配置jenkins属性');
//             return false;
//         }

//         const isWork = true;
//         const origin = await readSecret((db) => (isWork ? db.jenkins.url.internal : db.jenkins.url.public));
//         const jenkinsUrl = `http://${origin}/view/${name}/job/${id}/`;

//         // 获取Jenkins登录凭据
//         let username = '';
//         let password = '';

//         try {
//             // 先尝试从本地存储获取凭据
//             const credentials = await sql((db) => {
//                 // 确保jenkins对象存在
//                 if (!db.jenkins) {
//                     db.jenkins = {};
//                 }
//                 return {
//                     username: db.jenkins.username || '',
//                     password: db.jenkins.password || '',
//                 };
//             });

//             username = credentials.username;
//             password = credentials.password;
//         } catch (error) {
//             console.log('未找到Jenkins凭据');
//         }

//         // 如果凭据不存在，询问用户
//         if (!username) {
//             username = await askUser('请输入Jenkins用户名: ');
//             // 保存用户名到本地存储
//             await sql((db) => {
//                 if (!db.jenkins) {
//                     db.jenkins = {};
//                 }
//                 db.jenkins.username = username;
//                 return null;
//             });
//         }

//         if (!password) {
//             password = await askUser('请输入Jenkins密码: ');
//             // 保存密码到本地存储
//             await sql((db) => {
//                 if (!db.jenkins) {
//                     db.jenkins = {};
//                 }
//                 db.jenkins.password = password;
//                 return null;
//             });
//         }

//         console.log('正在启动浏览器...');
//         const browser = await puppeteer.launch({
//             headless: false, // 设置为false以便可以查看浏览器行为，便于调试
//             slowMo: 100, // 放慢操作以便于观察
//         });

//         const page = await browser.newPage();
//         console.log(`正在打开Jenkins页面: ${jenkinsUrl}`);
//         await page.goto(jenkinsUrl, { waitUntil: 'networkidle2' });

//         // 检查是否需要登录
//         const loginFormSelector = '#j_username';
//         const isLoginPage = await page.evaluate((selector) => {
//             return !!document.querySelector(selector);
//         }, loginFormSelector);

//         if (isLoginPage) {
//             console.log('正在登录Jenkins...');
//             // 填写登录表单
//             await page.type('#j_username', username);
//             await page.type('input[name="j_password"]', password);
//             await Promise.all([
//                 page.click('input[name="Submit"]'),
//                 page.waitForNavigation({ waitUntil: 'networkidle2' }),
//             ]);
//         }

//         // 查找并点击部署按钮
//         console.log('正在寻找部署按钮...');
//         const buildButtonSelector = '#tasks .task-link';
//         await page.waitForSelector(buildButtonSelector);

//         // 查找包含"Build"字样的链接并点击
//         const buildLinks = await page.$$eval(buildButtonSelector, (links) =>
//             links
//                 .filter((link) => link.textContent?.includes('Build') || link.textContent?.includes('构建'))
//                 .map((link) => link.getAttribute('href'))
//         );

//         if (buildLinks.length > 0) {
//             console.log('找到部署按钮，正在点击...');
//             await page.goto(`http://${origin}${buildLinks[0]}`, { waitUntil: 'networkidle2' });

//             // 如果需要选择分支
//             if (branch) {
//                 console.log(`正在选择分支: ${branch}`);
//                 // 等待分支选择界面加载
//                 await page
//                     .waitForSelector('input[name="parameter"]', { timeout: 10000 })
//                     .catch(() => console.log('没有找到分支选择界面，继续部署流程'));

//                 // 检查是否有分支选择输入框
//                 const hasBranchSelection = await page.evaluate(() => {
//                     return !!document.querySelector('input[name="parameter"]');
//                 });

//                 if (hasBranchSelection) {
//                     // 清除现有值并输入新分支名
//                     await page.evaluate(() => {
//                         const input = document.querySelector('input[name="parameter"]');
//                         if (input) {
//                             (input as HTMLInputElement).value = '';
//                         }
//                     });
//                     await page.type('input[name="parameter"]', branch);

//                     // 点击构建按钮
//                     const buildNowButton = await page.$('#yui-gen1-button');
//                     if (buildNowButton) {
//                         await buildNowButton.click();
//                         await page.waitForNavigation({ waitUntil: 'networkidle2' });
//                     }
//                 }
//             }

//             console.log('部署已开始，正在等待部署完成...');

//             // 查找最近的构建并打开构建详情页
//             await page.waitForSelector('#buildHistory .build-row', { timeout: 10000 });
//             const latestBuildLink = await page.$eval('#buildHistory .build-row:first-child a.build-link', (link) =>
//                 link.getAttribute('href')
//             );

//             if (latestBuildLink) {
//                 await page.goto(`http://${origin}${latestBuildLink}`, { waitUntil: 'networkidle2' });
//                 console.log('正在监控部署进度...');

//                 // 等待构建完成的标志
//                 let isBuilding = true;
//                 while (isBuilding) {
//                     // 每5秒检查一次构建状态
//                     await new Promise((resolve) => setTimeout(resolve, 5000));
//                     isBuilding = await page.evaluate(() => {
//                         const progressBar = document.querySelector('.progress-bar');
//                         return !!progressBar;
//                     });

//                     console.log('部署仍在进行中...');
//                 }

//                 // 检查构建结果
//                 const buildResult = await page.evaluate(() => {
//                     const successElement = document.querySelector('.build-status-icon.success');
//                     const failureElement = document.querySelector('.build-status-icon.failure');
//                     if (successElement) return 'success';
//                     if (failureElement) return 'failure';
//                     return 'unknown';
//                 });

//                 if (buildResult === 'success') {
//                     console.log('部署成功完成！');
//                 } else if (buildResult === 'failure') {
//                     console.log('部署失败，请查看Jenkins日志获取详细信息');
//                 } else {
//                     console.log('部署状态未知，请登录Jenkins查看详情');
//                 }
//             }
//         } else {
//             console.error('未找到部署按钮');
//             await browser.close();
//             return false;
//         }

//         // 保持浏览器打开一段时间后关闭
//         setTimeout(() => {
//             browser.close();
//             console.log('浏览器已关闭');
//         }, 10000);

//         return true;
//     } catch (error) {
//         console.error('自动部署过程中发生错误:', error);
//         return false;
//     }
// };
