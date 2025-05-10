import Code from '@/core/analyse/code';
import Cli from '@/core/analyse/cli';
export default function (prefix: string) {
    if (prefix === 'cli') {
        new Cli().main();
        return;
    }
    new Code().main();
}
