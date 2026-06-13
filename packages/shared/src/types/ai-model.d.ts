export interface AiModel {
    id: string;
    name: string;
    platform: string;
    url: string;
    mediaType: 'text' | 'image';
    apiKey: string;
    interfaceFormat: string;
    weight: number;
}
