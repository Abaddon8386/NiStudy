import { describe, expect, it } from "vitest";
import fixture from "../../../tests/fixtures/streak-xp.json";
import { computeXp } from "./xp";

describe("xp (fixture dùng chung với SQL)", () => {
  for (const c of fixture.cases) {
    it(c.name, () => {
      expect(computeXp(c, fixture.today)).toEqual({
        total: c.expected.xp_total,
        today: c.expected.xp_today,
      });
    });
  }
});
