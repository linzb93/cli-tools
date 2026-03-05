import { Router } from 'express';
import fs from 'fs-extra';
import path from 'node:path';
import { cacheRoot } from '@cli-tools/shared/constant/path';
import response from '../shared/response';

const router = Router();
const filePath = path.resolve(cacheRoot, 'awesome.json');

interface AwesomeItem {
    title: string;
    description: string;
    url: string;
    tag: string;
}

const getAwesomeList = async (): Promise<AwesomeItem[]> => {
    if (!fs.existsSync(filePath)) {
        return [];
    }
    return fs.readJSON(filePath).catch(() => []);
};

const saveAwesomeList = async (list: AwesomeItem[]) => {
    await fs.ensureFile(filePath);
    await fs.writeJSON(filePath, list, { spaces: 2 });
};

// 1. Search dependencies by tag or title
// 6. Show dependencies without tags (handled by type='untagged')
router.post('/list', async (req, res) => {
    const { keyword, tag, type } = req.body;
    try {
        const list = await getAwesomeList();
        let results = list;

        // Filter by untagged
        if (type === 'untagged') {
            results = results.filter((item) => !item.tag || item.tag.trim() === '');
        }

        // Filter by keyword (title)
        if (keyword) {
            const lowerKeyword = keyword.toLowerCase();
            results = results.filter((item) => item.title.toLowerCase().includes(lowerKeyword));
        }

        // Filter by tag
        if (tag) {
            const searchTags = tag
                .toLowerCase()
                .split(',')
                .map((t: string) => t.trim())
                .filter(Boolean);

            if (searchTags.length > 0) {
                results = results.filter((item) => {
                    const itemTags = (item.tag || '').toLowerCase().split(',');
                    return searchTags.some((searchTag: string) => itemTags.some((t) => t.trim() === searchTag));
                });
            }
        }

        response(res, results);
    } catch (error: any) {
        response(res, { message: error.message });
    }
});

// 2. Add/Edit dependencies
router.post('/save', async (req, res) => {
    const { title, description, url, tag, oldTitle } = req.body;

    if (!title) {
        return response(res, { message: 'Title is required' });
    }

    try {
        const list = await getAwesomeList();

        // Check for duplicate title (excluding self if editing)
        const exists = list.some(
            (item) =>
                item.title.toLowerCase() === title.toLowerCase() &&
                (!oldTitle || item.title.toLowerCase() !== oldTitle.toLowerCase()),
        );

        if (exists) {
            return response(res, { message: `Title "${title}" already exists` });
        }

        if (oldTitle) {
            // Edit mode
            const index = list.findIndex((item) => item.title === oldTitle);
            if (index !== -1) {
                list[index] = { title, description, url, tag };
            } else {
                return response(res, { message: `Item with title "${oldTitle}" not found` });
            }
        } else {
            // Add mode
            list.push({ title, description, url, tag });
        }

        await saveAwesomeList(list);
        response(res, {});
    } catch (error: any) {
        response(res, { message: error.message });
    }
});

// 3. Delete dependencies
router.post('/delete', async (req, res) => {
    const { title } = req.body;
    if (!title) {
        return response(res, { message: 'Title is required' });
    }

    try {
        const list = await getAwesomeList();
        const newList = list.filter((item) => item.title !== title);
        await saveAwesomeList(newList);
        response(res, {});
    } catch (error: any) {
        response(res, { message: error.message });
    }
});

// 4. Show tag list
router.post('/tags', async (_, res) => {
    try {
        const list = await getAwesomeList();
        const allTags = new Set<string>();
        list.forEach((item) => {
            if (item.tag) {
                item.tag.split(',').forEach((t) => {
                    const trimmed = t.trim();
                    if (trimmed) allTags.add(trimmed);
                });
            }
        });
        response(res, Array.from(allTags).sort());
    } catch (error: any) {
        response(res, { message: error.message });
    }
});

// 5. Modify tag list, return affected dependency names
router.post('/tags/edit', async (req, res) => {
    const { tags } = req.body; // Array of { from, to }
    if (!tags || !Array.isArray(tags)) {
        return response(res, { message: 'Tags mapping is required' });
    }

    try {
        const list = await getAwesomeList();
        const affectedTitles: string[] = [];
        let anyModified = false;

        list.forEach((item) => {
            if (!item.tag) return;

            let itemTags = item.tag.split(',').map((t) => t.trim());
            let modified = false;

            tags.forEach(({ from, to }: { from: string; to: string }) => {
                if (!from || !to) return;
                const lowerFrom = from.toLowerCase();

                // Check if item has this tag (case insensitive match for 'from')
                const tagIndex = itemTags.findIndex((t) => t.toLowerCase() === lowerFrom);
                if (tagIndex !== -1) {
                    itemTags[tagIndex] = to;
                    modified = true;
                }
            });

            if (modified) {
                // Remove duplicates after replacement
                itemTags = [...new Set(itemTags)];
                item.tag = itemTags.join(', ');
                affectedTitles.push(item.title);
                anyModified = true;
            }
        });

        if (anyModified) {
            await saveAwesomeList(list);
        }

        response(res, { affected: affectedTitles });
    } catch (error: any) {
        response(res, { message: error.message });
    }
});

export default router;
