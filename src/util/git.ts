import { execaCommand as execa } from 'execa';

export default {
    async isGit({ cwd = process.cwd() }) {
        try {
            await execa('git rev-parse --is-inside-work-tree', {
                cwd
            });
            return true;
        } catch (error) {
            return false;
        }
    },
    async clone({
        url,
        branch,
        dirName,
        shallow = false,
        cwd = process.cwd()
    }: {
        url: string,
        branch: string,
        dirName: string,
        shallow: boolean,
        cwd: string
    }) {
        try {
            await execa(`git clone${branch ? ` -b ${branch}` : ''} ${url}${dirName ? ` ${dirName}` : ''}${shallow ? ' --depth=1' : ''}`, {
                cwd,
                stdio: 'ignore'
            });
        } catch (error) {
            throw error;
        }
        return dirName || url.split('/').slice(-1)[0].slice(0, -4);
    },
    async pull({ cwd = process.cwd() } = {}) {
        try {
            await execa('git pull', {
                cwd
            });
        } catch (error) {
            throw error;
        }
    },
    async push({
        cwd = process.cwd(),
        branch = ''
    }: {
        cwd?: string,
        branch?: string
    } = {}) {
        if (branch) {
            await execa('git push', {
                cwd
            });
        } else {
            await execa(`git push --set-upstream origin ${branch}`);
        }
    },
    async remote() {
        const { stdout: data } = await execa('git remote -v');
        return data.split('\n')[0].match(/http.+\.git/)[0];
    },
    // 获取代码提交状态，分为未提交 1；未推送 2；已推送 3；不在master分支上 4；状态未知 0
    async getPushStatus({ cwd }) {
        let stdout = '';
        try {
            const data = await execa('git status', {
                cwd
            });
            stdout = data.stdout;
        } catch (error) {
            return 0;
        }
        if (stdout.includes('Changes not staged for commit') || stdout.includes('Changes to be committed')) {
            return 1;
        }
        if (stdout.includes('Your branch is ahead of ')) {
            return 2;
        }
        if (stdout.match(/On branch (\S+)/)[1] !== 'master') {
            return 4;
        }
        if (stdout.includes('nothing to commit')) {
            return 3;
        }
        return 0;
    },
    async getCurrentBranch() {
        const { stdout } = await execa('git branch --show-current');
        return stdout;
    },
    async tag() {
        const { stdout } = await execa('git tag');
        return stdout === '' ? [] : stdout.split('\n');
    },
    async deleteTag(tag: string, {
        includeRemote,
        cwd = process.cwd()
    }: {
        includeRemote?: boolean,
        cwd?: string
    } = {}) {
        if (includeRemote) {
            await execa(`git push origin :refs/tags/${tag}`, { cwd });
        } else {
            await execa(`git tag -d ${tag}`, { cwd });
        }
    }
}