export interface IFileAnalysis {
    lines: number;
    scriptLength?: number;
    templateLength?: number;
    styleLength?: number;
    file: string;
    type: 'normal' | 'warning' | 'danger';
}