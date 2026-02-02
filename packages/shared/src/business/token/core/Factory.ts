import { TokenParser } from './TokenParser';
import { JwtTokenParser } from '../implementations/JwtTokenParser';
import { Base64TokenParser } from '../implementations/Base64TokenParser';
// 创建解析器工厂
export class TokenParserFactory {
    private static parsers: Map<string, TokenParser> = new Map();

    static {
        this.parsers.set('jwt', new JwtTokenParser());
        this.parsers.set('base64', new Base64TokenParser());
    }

    static getAllParsers(): TokenParser[] {
        return Array.from(this.parsers.values());
    }

    static registerParser(name: string, parser: TokenParser): void {
        this.parsers.set(name, parser);
    }
}
