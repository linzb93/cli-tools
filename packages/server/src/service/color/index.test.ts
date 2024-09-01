import { describe, it, expect } from "vitest";
import Color from "./";

describe("color", () => {
  it("rgb to hex", () => {
    expect(new Color().main("#fff", { get: false })).toBe("255, 255, 255");
  });
  it("hex to rgb", () => {
    expect(new Color().main("33, 33, 33", { get: false })).toBe("#212121");
  });
});
