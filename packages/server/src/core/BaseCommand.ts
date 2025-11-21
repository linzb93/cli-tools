import Logger from '@/utils/logger';
import spinner, { Spinner } from '@/utils/spinner';
import inquirer from '@/utils/inquirer';
import sql, { type Database } from '@/utils/sql';
import { readSecret } from '@/utils/secret';
import { Low } from 'lowdb';

export default abstract class {
    protected logger: Logger;
    protected spinner: Spinner;
    protected inquirer: typeof inquirer;
    protected sql: <T = any>(callback: (data: Database, db?: Low<unknown>) => T) => Promise<T>;
    protected readSecret: <T = any>(callback: (data: any) => T) => Promise<T>;
    constructor() {
        this.logger = new Logger();
        this.spinner = spinner;
        this.inquirer = inquirer;
        this.sql = sql;
        this.readSecret = readSecret;
    }
    abstract main(...args: any[]): void;
}
