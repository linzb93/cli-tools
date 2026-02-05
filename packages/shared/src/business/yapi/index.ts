import { join } from 'node:path';
import fs from 'fs-extra';
import { BaseService } from '@cli-tools/shared/src/base/BaseService';
import dayjs from 'dayjs';
import {
    getYapiInterfaceTotal,
    getYapiInterfaceList,
    getYapiInterfaceDetail,
    type YapiInterfaceDetail,
    type SavedData,
} from './api';
import { yapiAuth } from './auth';
import pMap from 'p-map';

/**
 * Yapi接口文档处理类
 */
export class YapiService extends BaseService {
    /**
     * 文档存储路径
     */
    private docsPath = 'docs/api';

    /**
     * 内容存储路径
     */
    private contentPath = join(this.docsPath, 'content');

    /**
     * 索引文件路径
     */
    private indexPath = join(this.docsPath, 'index.json');

    /**
     * 接口文档数据集合
     */
    private apiDocs: SavedData[] = [];

    /**
     * Yapi命令入口
     * @param url Yapi网址
     */
    async main(url: string) {
        this.ensureDirectoriesExist();

        try {
            // 解析URL获取origin和路径部分
            const urlInfo = this.parseYapiUrl(url);
            if (!urlInfo) {
                this.logger.error('无效的Yapi URL');
                return;
            }

            // 获取cookie信息
            let cookie = await yapiAuth.getYapiCookie();
            if (!cookie) {
                const manualInput = await this.inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'confirm',
                        message: '无法自动获取登录信息，是否手动输入token?',
                        default: false,
                    },
                ]);

                if (manualInput.confirm) {
                    cookie = await yapiAuth.manualInputCookie();
                }

                if (!cookie) {
                    this.logger.error('无法获取Yapi登录信息');
                    return;
                }
            }

            if (urlInfo.type !== 'single') {
                // 获取接口总数
                const total = await getYapiInterfaceTotal({
                    origin: urlInfo.origin,
                    cookie,
                    projectId: urlInfo.projectId,
                    catId: urlInfo.type === 'category' ? urlInfo.catId : undefined,
                });

                if (!total) {
                    this.logger.info('未找到接口文档');
                    return;
                }

                // 获取接口列表
                const apiList = await getYapiInterfaceList({
                    origin: urlInfo.origin,
                    cookie,
                    projectId: urlInfo.projectId,
                    total,
                    catId: urlInfo.type === 'category' ? urlInfo.catId : undefined,
                });

                if (!apiList || apiList.length === 0) {
                    this.logger.info('未找到接口文档');
                    return;
                }

                // 获取接口详情
                await this.getApiDetails(urlInfo.origin, apiList, cookie);

                // 更新索引文件
                await this.updateIndexFile();

                this.spinner.succeed(`成功获取 ${this.apiDocs.length} 个接口文档`);
            } else {
                // 获取单个接口详情
                await this.getApiDetails(
                    urlInfo.origin,
                    [
                        {
                            _id: urlInfo.apiId,
                        },
                    ],
                    cookie,
                );

                // 更新索引文件
                await this.updateIndexFile();

                this.spinner.succeed(`成功获取 ${this.apiDocs.length} 个接口文档`);
            }
        } catch (error) {
            this.spinner.fail('获取接口文档失败');
            this.logger.error(error.message || error);
        }
    }

    /**
     * 确保文档目录存在
     */
    private ensureDirectoriesExist() {
        [this.docsPath, this.contentPath].forEach((dir) => {
            if (!fs.pathExistsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    /**
     * 解析Yapi URL
     * @param url Yapi网址
     * @returns 解析后的URL信息
     */
    private parseYapiUrl(url: string): {
        origin: string;
        type: 'all' | 'category' | 'single';
        projectId: string;
        catId?: string;
        apiId?: string;
    } | null {
        try {
            const urlObj = new URL(url);
            const { origin, pathname } = urlObj;
            const parts = pathname.split('/');

            // 提取项目ID
            const projectIdIndex = parts.indexOf('project');
            if (projectIdIndex === -1 || !parts[projectIdIndex + 1]) {
                return null;
            }
            const projectId = parts[projectIdIndex + 1];

            // 判断URL类型
            if (pathname.includes('/cat_')) {
                // 分类下全部接口
                const catId = parts[parts.length - 1].replace('cat_', '');
                return { origin, type: 'category', projectId, catId };
            } else if (pathname.includes('/interface/api/') && !parts[parts.length - 1].startsWith('cat_')) {
                // 单个接口
                const apiId = parts[parts.length - 1];
                return { origin, type: 'single', projectId, apiId };
            } else {
                // 全部接口
                return { origin, type: 'all', projectId };
            }
        } catch (error) {
            return null;
        }
    }

    /**
     * 获取接口详情
     * @param origin Yapi域名
     * @param apiList 接口列表
     * @param cookie Cookie字符串
     */
    private async getApiDetails(origin: string, apiList: Pick<YapiInterfaceDetail, '_id'>[], cookie: string) {
        await pMap(
            apiList,
            async (apiItem) => {
                try {
                    const apiDetail = await getYapiInterfaceDetail(origin, cookie, apiItem._id);

                    if (!apiDetail) {
                        this.logger.error(`获取接口 ${apiItem._id} 详情失败`);
                        return;
                    }

                    // 保存接口基本信息到内存
                    const indexItem = {
                        id: apiDetail._id,
                        title: apiDetail.title,
                        path: apiDetail.path,
                        method: apiDetail.method,
                        updateTime: dayjs(apiDetail.up_time * 1000).format('YYYY-MM-DD HH:mm:ss'),
                        projectId: apiDetail.project_id,
                        catId: apiDetail.catid,
                    };
                    this.apiDocs.push(indexItem);

                    // 创建并保存详细信息到文件
                    const contentDir = join(this.contentPath, `${apiDetail.project_id}-${apiDetail._id}`);
                    if (!fs.existsSync(contentDir)) {
                        fs.mkdirSync(contentDir, { recursive: true });
                    }

                    // 保存原始数据
                    const originFile = join(contentDir, 'origin.json');
                    fs.writeFileSync(
                        originFile,
                        JSON.stringify(
                            {
                                ...indexItem,
                                request: JSON.parse(apiDetail.req_body_other),
                                response: JSON.parse(apiDetail.res_body),
                            },
                            null,
                            4,
                        ),
                    );

                    // 创建空的 api.md 文件
                    const apiMdFile = join(contentDir, 'api.md');
                    if (!fs.existsSync(apiMdFile)) {
                        fs.writeFileSync(apiMdFile, '');
                    }
                } catch (error) {
                    this.logger.error(`处理接口 ${apiItem._id} 时出错:`, error.message);
                }
            },
            { concurrency: 4 },
        );
    }

    /**
     * 更新索引文件
     */
    private async updateIndexFile() {
        try {
            let existingDocs: SavedData[] = [];

            // 检查索引文件是否存在
            if (fs.pathExistsSync(this.indexPath)) {
                try {
                    existingDocs = await fs.readJSON(this.indexPath);
                } catch (error) {
                    this.logger.error('读取索引文件失败，将创建新文件');
                }
            }

            // 合并新旧数据
            const mergedDocs = [...existingDocs];

            this.apiDocs.forEach((newDoc) => {
                const existingIndex = mergedDocs.findIndex(
                    (doc) => doc.id === newDoc.id && doc.projectId === newDoc.projectId,
                );

                if (existingIndex === -1) {
                    // 添加新文档
                    mergedDocs.push(newDoc);
                } else if (mergedDocs[existingIndex].updateTime < newDoc.updateTime) {
                    // 更新已存在但较旧的文档
                    mergedDocs[existingIndex] = newDoc;
                }
            });

            // 写入更新后的索引文件
            await fs.writeJSON(this.indexPath, mergedDocs, { spaces: 4 });
        } catch (error) {
            this.logger.error('更新索引文件失败:', error.message);
        }
    }
}
