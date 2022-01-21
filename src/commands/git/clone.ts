import path from 'path';
import ora from 'ora';
import fs from 'fs-extra';
import axios, {AxiosResponse} from 'axios';
import chalk from 'chalk';
import cheerio, {CheerioAPI, Node as CheerioNode} from 'cheerio';
import npmPage from '../npm/util/npmPage.js';
import git from '../../util/git.js';
import getSetting from '../../util/db.js';
import { pRetry } from '../../util/pFunc.js';
import BaseCommand from '../../util/BaseCommand.js';

interface Options {
    dir?: string,
    open?:boolean,
    from?:string
}
export default class extends BaseCommand {
    private pkg: string;
    private options: Options;
    constructor(pkg:string[], options:Options) {
        super();
        this.pkg = pkg[0];
        this.options = options;
    }
    async run() {
        const { pkg, options } = this;
        this.helper.validate({
            pkg
        }, {
            pkg: [{
                required: true,
                message: '请输入项目来源，可以是npm包、GitHub搜索关键词，或Git项目地址'
            }]
        });
        const spinner = ora('正在下载');
        let dirName: string;
        const openMap = await getSetting('open');
        if (!openMap[options.dir]) {
            options.dir = 'source';
        }
        if (this.isGitUrl(pkg)) {
            const url = this.toGitUrl(pkg);
            spinner.start();
            try {
                dirName = await git.clone({
                    url,
                    dirName: path.basename(url, '.git'),
                    cwd: openMap[options.dir]
                });
            } catch (error) {
                spinner.fail(`下载失败:
                ${error.message}`);
                return;
            }
            spinner.succeed('下载成功');
            if (options.open) {
                await this.helper.openInEditor(path.resolve(openMap[options.dir], dirName));
            }
            return;
        }
        if (options.from === 'github' || options.from === 'gh') {
            let pageRes:AxiosResponse;
            spinner.start();
            try {
                pageRes = await pRetry(() => axios({
                    url: `https://github.com/search?q=${pkg}`,
                    timeout: 15000
                }), {
                    retries: 5,
                    retryTimesCallback: times => {
                        spinner.text = `第${times}次搜索失败，正在重试`;
                    }
                });
            } catch {
                spinner.fail('下载失败:访问已超时');
                return;
            }
            const $ = cheerio.load(pageRes.data);
            const $target = $('.repo-list').first().children()
                .first();
            const url = `https://github.com${$target.find('a').first().attr('href')}.git`;
            spinner.text = `正在从${chalk.cyan(url)}下载`;
            try {
                dirName = await pRetry(() => git.clone({
                    url,
                    dirName: path.basename(url, '.git'),
                    cwd: openMap[options.dir]
                }), {
                    retries: 2,
                    retryTimesCallback: times => {
                        spinner.text = `第${times}次拉取失败，正在重新尝试拉取`;
                    }
                });
            } catch (error) {
                spinner.fail(`下载失败:
                ${error.message}`);
                return;
            }
            spinner.succeed('下载成功');
            if (options.open) {
                await this.helper.openInEditor(path.resolve(openMap[options.dir], dirName));
            }
            return;
        }
        let page;
        try {
            page = await npmPage(pkg);
        } catch (error) {
            this.logger.error(error);
            return;
        }
        const repo = page.get('repository');
        spinner.start();
        const cwd = getSetting('open.source');
        if (await fs.pathExists(path.join(cwd, path.basename(repo)))) {
            spinner.text = '正在拉取最新代码';
            try {
                await pRetry(() => git.pull({
                    cwd: path.join(cwd, path.basename(repo))
                }), {
                    retries: 5,
                    retryTimesCallback: times => {
                        spinner.text = `第${times}次拉取失败，正在重新尝试拉取`;
                    }
                });
            } catch (error) {
                spinner.fail('拉取代码失败');
                return;
            }
            spinner.succeed('拉取代码成功');
            if (options.open) {
                await this.helper.openInEditor(path.resolve(cwd, path.basename(repo)));
            }
            return;
        }
        try {
            dirName = await pRetry(async () => git.clone({
                url: `${repo}.git`,
                shallow: true,
                cwd
            }), {
                retries: 5,
                retryTimesCallback: times => {
                    spinner.text = `第${times}次拉取失败，正在重新尝试拉取`;
                }
            });
        } catch (error) {
            spinner.fail('下载失败');
            console.log(error.message);
            return;
        }
        spinner.succeed('下载成功');
        if (options.open) {
            await this.helper.openInEditor(path.resolve(cwd, dirName));
        }
    }
    isGitUrl(url: string): boolean {
        return this.helper.isURL(url) || this.isGitSSH(url);
    }
    isGitSSH(url: string): boolean {
        return url.startsWith('git@') && url.endsWith('.git');
    }
    toGitUrl(url: string): string {
        if (this.helper.isURL(url)) {
            return url.endsWith('.git') ? url : `${url}.git`;
        }
        return url
            .replace(/git@([a-z\.]+\.com)\:/, 'https://$1/')
            .replace(/[^\.git]$/, '.git');
    }
}
