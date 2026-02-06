import { shortcut } from '@cli-tools/shared/business/shortcut';

export const shortcutCommand = (name: string) => {
    shortcut(name);
};
