import { addIdea, listIdeas } from '@/business/idea/index';
import chalk from 'chalk';

export const ideaCommand = async (subCommand?: string, rest?: string[]) => {
    if (!subCommand) {
        // No args: Read clipboard and add
        await addIdea();
        return;
    }

    if (subCommand === 'list') {
        await listIdeas();
        return;
    }

    if (subCommand === 'add') {
        const content = rest && rest.length > 0 ? rest.join(' ') : undefined;
        await addIdea(content);
        return;
    }

    // Treat subCommand as content if not a known command
    const content = [subCommand, ...(rest || [])].join(' ');
    await addIdea(content);
};
