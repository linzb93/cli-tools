import BaseCommand from '../BaseCommand';
import internalIp from 'internal-ip';
import chalk from 'chalk';
import { Database } from '@/utils/sql';
import globalConfig from '../../../../../config.json';

/**
 * Agent规则接口
 */
interface AgentRule {
    /**
     * 来源路径
     */
    from: string;
    /**
     * 目标路径
     */
    to: string;
}

/**
 * Agent数据结构接口
 */
interface Agent {
    /**
     * 唯一ID，自增
     */
    id: number;
    /**
     * 代理名称
     */
    name: string;
    /**
     * 匹配接口代理的前缀
     */
    prefix: string;
    /**
     * 代理规则列表
     */
    rules: AgentRule[];
}

/**
 * Agent命令选项接口
 */
export interface Options {
    /**
     * 添加代理
     * @default false
     */
    add?: boolean;
    /**
     * 删除代理
     * @default false
     */
    delete?: boolean;
}

/**
 * Agent命令实现类
 */
export default class extends BaseCommand {
    /**
     * 全局配置端口号
     */
    private port: number;

    /**
     * 构造函数
     */
    constructor() {
        super();
        // 从全局配置中读取端口号
        this.port = globalConfig.port.production || 9527;
    }

    /**
     * 主入口方法
     * @param options 命令选项
     */
    async main(options: Options) {
        if (options.add) {
            await this.addAgent();
            return;
        }

        if (options.delete) {
            await this.deleteAgent();
            return;
        }

        await this.listAgent();
    }

    /**
     * 列出代理
     */
    private async listAgent() {
        // 获取所有代理列表
        const agentList = await this.getAgentList();

        if (!agentList || agentList.length === 0) {
            this.logger.warn('当前没有可以展示的代理，请先添加代理');
            return;
        }

        // 让用户选择要展示的代理
        const { selectedAgentId } = await this.inquirer.prompt([
            {
                type: 'list',
                name: 'selectedAgentId',
                message: '请选择要展示的代理',
                choices: agentList.map((agent) => ({
                    name: agent.name,
                    value: agent.id,
                })),
            },
        ]);

        // 找到选中的代理
        const selectedAgent = agentList.find((agent) => agent.id === selectedAgentId);

        if (!selectedAgent) {
            this.logger.error('未找到选中的代理');
            return;
        }

        // 获取本机IP
        const ip = await internalIp.v4();

        // 显示代理信息
        this.displayAgentInfo(selectedAgent, ip);
    }

    /**
     * 添加代理
     */
    private async addAgent() {
        // 获取当前最大ID
        const agentList = (await this.getAgentList()) || [];
        const maxId = agentList.length > 0 ? Math.max(...agentList.map((agent) => agent.id)) : 0;

        // 输入代理名称
        const { name } = await this.inquirer.prompt([
            {
                type: 'input',
                name: 'name',
                message: '请输入代理名称',
                validate: (input: string) => {
                    if (!input.trim()) {
                        return '代理名称不能为空';
                    }
                    return true;
                },
            },
        ]);

        // 输入接口代理前缀
        const { prefix } = await this.inquirer.prompt([
            {
                type: 'input',
                name: 'prefix',
                message: '请输入接口代理前缀',
                validate: (input: string) => {
                    if (!input.trim()) {
                        return '接口代理前缀不能为空';
                    }

                    // 确保前缀以/开头
                    if (!input.startsWith('/')) {
                        return '前缀必须以/开头';
                    }

                    return true;
                },
            },
        ]);

        // 收集规则
        const rules: AgentRule[] = [];
        let continueAdding = true;

        while (continueAdding) {
            const { rule } = await this.inquirer.prompt([
                {
                    type: 'input',
                    name: 'rule',
                    message: '请输入规则 (格式: 来源,目标) 输入:q退出',
                    validate: (input: string) => {
                        if (input === ':q') return true;

                        if (!input.trim()) {
                            return '规则不能为空';
                        }

                        const parts = input.split(',').map((part) => part.trim());
                        if (parts.length !== 2) {
                            return '规则格式错误，请使用"来源,目标"格式';
                        }

                        if (!parts[0] || !parts[1]) {
                            return '来源和目标都不能为空';
                        }

                        return true;
                    },
                },
            ]);

            const [from, to] = rule.split(',').map((part) => part.trim());
            rules.push({ from, to });

            const { addMore } = await this.inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'addMore',
                    message: '是否继续添加规则?',
                    default: true,
                },
            ]);

            continueAdding = addMore;
        }

        // 确保至少有一条规则
        if (rules.length === 0) {
            this.logger.error('至少需要添加一条规则');
            return;
        }

        // 创建新代理
        const newAgent: Agent = {
            id: maxId + 1,
            name,
            prefix,
            rules,
        };

        // 保存到数据库
        await this.saveAgent(newAgent);

        this.logger.success(`代理 "${name}" 添加成功`);
    }

    /**
     * 删除代理
     */
    private async deleteAgent() {
        // 获取所有代理列表
        const agentList = await this.getAgentList();

        if (!agentList || agentList.length === 0) {
            this.logger.warn('当前没有可以删除的代理');
            return;
        }

        // 让用户选择要删除的代理
        const { selectedAgentIds } = await this.inquirer.prompt([
            {
                type: 'checkbox',
                name: 'selectedAgentIds',
                message: '请选择要删除的代理',
                choices: agentList.map((agent) => {
                    return {
                        name: agent.name,
                        value: agent.id,
                    };
                }),
            },
        ]);

        if (selectedAgentIds.length === 0) {
            this.logger.info('未选择任何代理，操作已取消');
            return;
        }

        // 删除选中的代理
        await this.deleteAgentById(selectedAgentIds);

        this.logger.success(`已删除 ${selectedAgentIds.length} 个代理`);
    }

    /**
     * 获取所有代理列表
     * @returns 代理列表
     */
    private async getAgentList(): Promise<Agent[]> {
        return await this.sql((db) => {
            // 如果agent字段不存在，初始化为空数组
            if (!db.agent) {
                db.agent = [];
                return [];
            }
            return db.agent;
        });
    }

    /**
     * 保存代理到数据库
     * @param newAgent 新代理
     */
    private async saveAgent(newAgent: Agent) {
        await this.sql((db) => {
            if (!db.agent) {
                db.agent = [];
            }
            db.agent.push(newAgent);
            return null; // 触发写入
        });
    }

    /**
     * 根据ID删除代理
     * @param ids 要删除的代理ID列表
     */
    private async deleteAgentById(ids: number[]) {
        await this.sql((db) => {
            if (!db.agent) return;
            db.agent = db.agent.filter((agent: Agent) => !ids.includes(agent.id));
            return null; // 触发写入
        });
    }

    /**
     * 显示代理信息
     * @param agent 代理对象
     * @param ip 本机IP
     */
    private displayAgentInfo(agent: Agent, ip: string) {
        const content = this.formatAgentRules(agent, ip);

        this.logger.box({
            title: agent.name,
            borderColor: 'green',
            content,
            padding: 1,
        });
    }

    /**
     * 格式化代理规则显示
     * @param agent 代理对象
     * @param ip 本机IP
     * @returns 格式化后的规则文本
     */
    private formatAgentRules(agent: Agent, ip: string): string {
        return agent.rules
            .map((rule) => {
                return `http://${ip}:${this.port}${agent.prefix}${rule.from} -> ${rule.to}`;
            })
            .join('\n');
    }
}
