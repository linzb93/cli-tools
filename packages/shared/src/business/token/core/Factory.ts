import { TokenParser } from './TokenParser';
import { jwtTokenParser } from '../implementations/JwtTokenParser';
import { base64TokenParser } from '../implementations/Base64TokenParser';

const parsers: Map<string, TokenParser> = new Map();

parsers.set('jwt', jwtTokenParser);
parsers.set('base64', base64TokenParser);

export const getAllParsers = (): TokenParser[] => {
    return Array.from(parsers.values());
};

export const registerParser = (name: string, parser: TokenParser): void => {
    parsers.set(name, parser);
};
