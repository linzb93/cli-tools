import { Response } from "express";

export function sse(data: any, last = false) {
  return `data:${JSON.stringify({
    data,
    last,
  })}\n\n`;
}

export function setHeader(res: Response) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
}
