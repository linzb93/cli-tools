export type TimePeriod = 'day' | 'week' | 'month' | 'all';

export interface CliAnalyseOptions {
    period?: TimePeriod;
}