import { findContent } from '@/common/markdown';

export default async () => {
    const content = await findContent({
        filePath: 'commands/git/README.md',
        title: 'git deploy',
        level: 2,
    });
    console.log(content);
};
