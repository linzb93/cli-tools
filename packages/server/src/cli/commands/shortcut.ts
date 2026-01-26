import { ShortcutManager } from '@/core/shortcut';

export const shortcutCommand = (name: string) => {
    new ShortcutManager().main(name);
};
