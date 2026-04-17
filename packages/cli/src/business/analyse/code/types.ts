export interface IFileAnalysis {
    lines: number;
    excludedLines: number;
    scriptLength?: number;
    templateLength?: number;
    styleLength?: number;
    file: string;
    type: 'normal' | 'warning' | 'danger';
}