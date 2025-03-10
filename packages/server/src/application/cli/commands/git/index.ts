import clone from './clone';
import deploy from './deploy';
import pull from './pull';
import push from './push';
import rename from './rename';
import branch from './branch';
import scan from './scan';
import tag from './tag';

export default function (subCommand: string, data: string[], options: any) {
    const commandMap = {
        clone,
        deploy,
        pull,
        push,
        scan,
        branch,
        rename,
        tag,
    };
    if (commandMap[subCommand]) {
        commandMap[subCommand]();
    }
}
