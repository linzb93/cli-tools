import BaseClass from './Base';

export default class Github extends BaseClass {
    condition(remoteUrl: string): boolean {
        return remoteUrl.startsWith('https//www.github.com');
    }
    async main() {}
}
