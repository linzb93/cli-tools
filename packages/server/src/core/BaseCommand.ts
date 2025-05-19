import Logger from '@/utils/logger';
import spinner, { Spinner } from '@/utils/spinner';
import inquirer from '@/utils/inquirer';
import sql, { type Database } from '@/utils/sql';
import { readSecret } from '@/utils/secret';

export default abstract class {
    protected logger: Logger;
    protected spinner: Spinner;
    protected inquirer: typeof inquirer;
    protected sql: (callback: (data: Database) => any) => Promise<any>;
    protected readSecret: (callback: (data: any) => any) => Promise<any>;
    constructor() {
        this.logger = new Logger();
        this.spinner = spinner;
        this.inquirer = inquirer;
        this.sql = sql;
        this.readSecret = readSecret;
    }
    abstract main(...args: any[]): void;
}
