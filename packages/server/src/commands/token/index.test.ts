import { describe, it, expect } from 'vitest';
import token from '.';

describe('token', () => {
  const tokenStr = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhcHBLZXkiOiI0IiwiZXhwIjoxNzE2MzY5OTQ4LCJpYXQiOjE3MTYyODM1NDgsInBsYXRmb3JtIjo4LCJtZW1iZXJJZCI6IjE2NDYyODMyMzcyIn0.KOOF8Yl6E5nQsK2nYKbxXTYMllMF8Eh76XsGvqH2O8Y';
  it('时间解析过的', () => {
    const output = token(tokenStr, {}) as any;
    expect(output.iat).toBe('2024-05-21 17:25:48');
  });
  it('时间未解析过的', () => {
    const output = token(tokenStr, {
      origin: true
    }) as any;
    expect(output.iat).toBe(1716283548);
  });
  it('完整的解析', () => {
    const output = token(tokenStr, {
      complete: true
    }) as any;
    expect(output.header.alg).toBe('HS256');
  });
});
