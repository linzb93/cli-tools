export interface YapiUrlInfo {
    origin: string;
    type: 'all' | 'category' | 'single';
    projectId: string;
    catId?: string;
    apiId?: string;
}
