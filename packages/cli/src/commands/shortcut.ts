import { ShortcutService } from '@cli-tools/shared/src/business/shortcut';

export const shortcutCommand = (name: string) => {
    new ShortcutService().main(name);
};
