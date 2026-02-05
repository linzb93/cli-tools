import { ShortcutService } from '@cli-tools/shared/business/shortcut';

export const shortcutCommand = (name: string) => {
    new ShortcutService().main(name);
};
