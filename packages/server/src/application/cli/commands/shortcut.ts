import Shortcut from '@/service/shortcut';

export default (name: string) => {
    new Shortcut(name).main();
};
