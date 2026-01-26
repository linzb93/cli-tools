import Shortcut from '@/core/shortcut';

export const shortcutCommand = (name: string) => {
    new Shortcut().main(name);
};
