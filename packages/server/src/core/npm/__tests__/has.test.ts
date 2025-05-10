import { describe, it, expect } from "vitest";
import Has from "../has";

describe("npm has", () => {
  it("一个存在的npm模块", async () => {
    const has = new Has().main;
    const hasModule = await has(["vitest"], {
      dev: false,
    });
    expect(hasModule).toBeTruthy();
  });
  it("一个不存在的npm模块", async () => {
    const has = new Has().main;
    const hasModule = await has(["vitest1234567"], {
      dev: false,
    });
    expect(hasModule).toBeFalsy();
  });
  it("一个组织里的npm模块", async () => {
    const has = new Has().main;
    const hasModule = await has(["@vue/shared"], {
      dev: false,
    });
    expect(hasModule).toBeTruthy();
  });
});
