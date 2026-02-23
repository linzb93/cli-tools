import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import clipboardy from 'clipboardy';
import dayjs from 'dayjs';
import chalk from 'chalk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Resolve to cli-tools project root: packages/cli/src/business/idea -> ../../../../../
const PROJECT_ROOT = path.resolve(__dirname, '../../../../../');
const DOCS_DIR = path.join(PROJECT_ROOT, 'docs');
const IDEAS_FILE = path.join(DOCS_DIR, 'ideas.md');

export const addIdea = async (content?: string) => {
    let ideaContent = content;

    if (!ideaContent) {
        try {
            ideaContent = await clipboardy.read();
        } catch (error) {
            console.error(chalk.red('Failed to read clipboard. Please provide content manually.'));
            return;
        }
    }

    if (!ideaContent || !ideaContent.trim()) {
        console.warn(chalk.yellow('Content is empty. Nothing to record.'));
        return;
    }

    // Ensure docs directory exists
    await fs.ensureDir(DOCS_DIR);

    // Ensure ideas file exists with header
    if (!(await fs.pathExists(IDEAS_FILE))) {
        await fs.writeFile(IDEAS_FILE, '# Ideas\n\n');
    }

    const timestamp = dayjs().format('YYYY-MM-DD HH:mm');
    const newEntry = `- [ ] [${timestamp}] ${ideaContent.trim()}\n`;

    await fs.appendFile(IDEAS_FILE, newEntry);

    console.log(chalk.green(`Idea recorded successfully to ${IDEAS_FILE}`));
    console.log(chalk.gray(newEntry.trim()));
};

export const listIdeas = async () => {
    if (!(await fs.pathExists(IDEAS_FILE))) {
        console.log(chalk.yellow('No ideas recorded yet.'));
        return;
    }

    const content = await fs.readFile(IDEAS_FILE, 'utf-8');
    console.log(content);
};
