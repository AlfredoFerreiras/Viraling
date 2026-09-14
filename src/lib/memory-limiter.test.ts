import { describe, expect, it } from "vitest";
import { MemoryLimiter } from "./memory-limiter";

describe("MemoryLimiter", () => {
  it("allows up to max hits inside the window and blocks the next one", () => {
    const l = new MemoryLimiter(3, 60_000);
    const t = 1_000_000;
    expect(l.limit("a", t).success).toBe(true);
    expect(l.limit("a", t + 1).success).toBe(true);
    expect(l.limit("a", t + 2).success).toBe(true);
    const blocked = l.limit("a", t + 3);
    expect(blocked.success).toBe(false);
    expect(blocked.reset).toBe(t + 60_000);
  });

  it("keys are independent", () => {
    const l = new MemoryLimiter(1, 60_000);
    expect(l.limit("a").success).toBe(true);
    expect(l.limit("b").success).toBe(true);
    expect(l.limit("a").success).toBe(false);
  });

  it("frees capacity once old hits fall out of the window", () => {
    const l = new MemoryLimiter(1, 1_000);
    const t = 5_000;
    expect(l.limit("a", t).success).toBe(true);
    expect(l.limit("a", t + 999).success).toBe(false);
    expect(l.limit("a", t + 1_001).success).toBe(true);
  });

  it("prunes stale keys when the map grows past the cap", () => {
    const l = new MemoryLimiter(1, 1_000, 5);
    const t = 10_000;
    for (let i = 0; i < 6; i++) l.limit(`k${i}`, t);
    // all six are fresh, nothing pruned yet
    expect(l["hits"].size).toBe(6);
    // a hit far in the future makes the old ones stale and triggers pruning
    l.limit("new", t + 5_000);
    expect(l["hits"].size).toBe(1);
  });
});
