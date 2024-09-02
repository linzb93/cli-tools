import { describe, it, expect } from "vitest";
import Search from "./search";

describe("npm search", () => {
  it.todo("获取单个npm模块信息", async () => {
    const search = new Search().main(["lodash"], {});
    const npmData = (await search) as any;
    expect(npmData.weeklyDl).toBeGreaterThan(0);
    expect(npmData.lastPb).not.toBeNull();
    expect(npmData.version).not.toBeNull();
  });
  it.todo("获取多个npm模块信息", async () => {
    const search = new Search().main(["vite", "vitest"], {});
    const npmData = (await search) as any;
    expect(npmData.weeklyDl).toBeGreaterThan(0);
    expect(npmData.lastPb).not.toBeNull();
    expect(npmData.version).not.toBeNull();
  });
});
