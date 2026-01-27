import { ShortcutManager } from '@cli-tools/shared/src/core/shortcut';

export const shortcutCommand = (name: string) => {
    new ShortcutManager().main(name);
};
