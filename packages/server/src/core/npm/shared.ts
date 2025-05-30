import { get } from 'lodash-es';
import { load, CheerioAPI } from 'cheerio';
import axios from 'axios';
import fs from 'fs-extra';
import readPkg from 'read-pkg';
import inquirer from '@/utils/inquirer';

/**
 * 总体思路：
 * 1. npm、pnpm、yarn都要支持，但现在慢慢淘汰yarn
 * 2. 所有的功能写清楚注释
 * npm public API: https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md
 * or cnpm: https://registry.npmmirror.com/ 版本号支持缩写
 */

interface RegData {
    description: string;
}

export class Npm {
    private $: CheerioAPI;
    private regData: RegData;
    constructor($: CheerioAPI, regData: RegData) {
        this.$ = $;
        this.regData = regData;
    }
    /**
     * 使用cheerio，获取指定模块的npm页面信息
     * @param {string} type - 模块名称
     * @returns {string} - 模块信息
     */
    get(type: 'repository' | 'weeklyDl' | 'lastPb' | 'description' | 'version'): string {
        const { $ } = this;
        if (type === 'repository') {
            return $('#repository').next().find('a').attr('href') as string;
        }
        if (type === 'weeklyDl') {
            return $('._9ba9a726').text();
        }
        if (type === 'lastPb') {
            return $('.f2874b88 time').text();
        }
        if (type === 'description') {
            return this.regData.description;
        }
        if (type === 'version') {
            return $('.f2874b88.fw6.mb3.mt2.truncate').eq(2).text();
        }
        return '';
    }
}
async function getPage(pkg: string): Promise<Npm> {
    let html = '';
    try {
        const [htmlRes, registryRes] = await Promise.all([
            axios.get(`https://www.npmjs.com/package/${pkg}`),
            axios.get(`https://registry.npmjs.com/${pkg}/latest`),
        ]);
        html = htmlRes.data;
        const $ = load(html);
        return new Npm($, registryRes.data);
    } catch (e) {
        // 没找到
        if (get(e, 'response.status') === 404) {
            let res = await axios.get(`https://www.npmjs.com/search?q=${pkg}`);
            html = res.data;
            const $ = load(html);
            const list = $('.d0963384')
                .find('.db7ee1ac')
                .filter((index) => index <= 10)
                .map((_, item) => (item.children[0] as any).data);
            const choices = Array.prototype.slice.call(list);
            if (choices.length) {
                throw new Error('检测到您输入的npm依赖有误');
            }
            const { pkgAns } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'pkgAns',
                    message: '检测到您输入的npm依赖有误，请选择下面其中一个',
                    choices,
                },
            ]);
            res = await axios.get(`https://www.npmjs.com/package/${pkgAns}`);
            html = res.data;
            return new Npm(load(html), { description: '' });
        } else {
            throw e;
        }
    }
}

// 判断使用的npm客户端
const getNpmClient = () => {
    try {
        fs.accessSync('pnpm-lock.yaml');
        return 'pnpm';
    } catch {}
    try {
        fs.accessSync('yarn.lock');
        return 'yarn';
    } catch {
        return 'npm';
    }
};

function getVersion(packageName: string): string {
    const match = packageName.match(/@([0-9a-z\.\-]+)@/);
    return match ? (match as RegExpMatchArray)[1] : '';
}

async function getList(name: string) {
    const dirs = await fs.readdir('node_modules');
    try {
        await import(name);
    } catch (error) {
        return {
            list: [],
            versionList: [],
        };
    }
    if (getNpmClient() === 'yarn') {
        return {
            list: [name],
            versionList: [
                (
                    await readPkg({
                        cwd: `node_modules/${name}`,
                    })
                ).version,
            ],
        };
    }
    const matches = dirs.filter((dir) => dir.startsWith(`_${name.startsWith('@') ? name.replace('/', '_') : name}@`));
    if (!matches.length) {
        return {
            list: [name],
            versionList: [
                (
                    await readPkg({
                        cwd: `node_modules/${name}`,
                    })
                ).version,
            ],
        };
    }
    return {
        list: matches,
        versionList: matches.map((item) => getVersion(item)),
    };
}

const npm = {
    getPage,
    getVersion,
    getList,
    getNpmClient,
};
export default npm;
