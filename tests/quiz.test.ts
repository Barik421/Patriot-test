import { describe, expect, it } from "vitest";
import { questions } from "../src/data/questions";
import { results } from "../src/data/results";
import {
  calculateResult,
  categories,
  newSession,
  parseResult,
  resultHash,
  shuffle,
  validSession,
} from "../src/lib/quiz";

describe("editorial database", () => {
  it("has 120 unique questions and four distinct valid answers each", () => {
    expect(questions).toHaveLength(120);
    expect(new Set(questions.map((q) => q.id)).size).toBe(120);
    expect(new Set(questions.map((q) => q.text)).size).toBe(120);
    for (const q of questions) {
      expect(q.answers).toHaveLength(4);
      expect(new Set(q.answers.map((a) => a.text)).size).toBe(4);
      for (const a of q.answers) {
        expect(a.weights).toHaveLength(4);
        expect(
          a.weights.every((w) => Number.isInteger(w) && w >= 0 && w <= 6),
        ).toBe(true);
        expect(a.weights.reduce((a, b) => a + b, 0)).toBe(9);
      }
    }
  });
  it("has ten unique descriptions for each of the four results", () => {
    expect(Object.keys(results)).toHaveLength(4);
    for (const r of Object.values(results)) {
      expect(r.descriptions).toHaveLength(10);
      expect(new Set(r.descriptions).size).toBe(10);
    }
  });
});
describe("randomization and restoration", () => {
  it("selects exactly 20 unique questions with valid shuffled answer IDs", () => {
    const signatures = new Set<string>();
    for (let i = 0; i < 250; i++) {
      const s = newSession(questions);
      expect(validSession(s, questions)).toBe(true);
      expect(new Set(s.questionIds).size).toBe(20);
      signatures.add(s.questionIds.join(","));
    }
    expect(signatures.size).toBeGreaterThan(245);
  });
  it("shuffles a copy without changing its input", () => {
    const original = [1, 2, 3, 4];
    expect(shuffle(original, () => 0)).toEqual([2, 3, 4, 1]);
    expect(original).toEqual([1, 2, 3, 4]);
  });
  it("rejects corrupt, obsolete and incomplete saved structures", () => {
    const s = newSession(questions);
    expect(validSession({ ...s, index: 21 }, questions)).toBe(false);
    expect(validSession({ ...s, version: 0 }, questions)).toBe(false);
    expect(validSession({ ...s, answerOrders: [] }, questions)).toBe(false);
    expect(validSession({ ...s, index: 2 }, questions)).toBe(false);
    expect(validSession({ ...s, answers: { not_real: "a0" } }, questions)).toBe(
      false,
    );
    expect(() => calculateResult(s, questions)).toThrow("Incomplete");
    expect(validSession(null, questions)).toBe(false);
  });
});
describe("weighted scoring", () => {
  it.each(categories)(
    "can produce %s regardless of shuffled display order",
    (category) => {
      const i = categories.indexOf(category);
      const s = newSession(questions);
      s.questionIds.forEach((id) => (s.answers[id] = `a${i}`));
      const r = calculateResult(s, questions);
      expect(r.category).toBe(category);
      expect(r.percent).toBe(100);
      s.answerOrders.forEach((order) => order.reverse());
      expect(calculateResult(s, questions)).toEqual(r);
    },
  );
  it("supports back navigation, answer changes and deterministic ties", () => {
    const s = newSession(questions);
    s.questionIds.forEach((id, i) => (s.answers[id] = i < 10 ? "a0" : "a1"));
    s.index = 19;
    expect(calculateResult(s, questions).category).toBe("almost-patriot");
    s.index = 4;
    s.answers[s.questionIds[4]] = "a3";
    const restored = JSON.parse(JSON.stringify(s));
    expect(validSession(restored, questions)).toBe(true);
    expect(calculateResult(restored, questions)).toEqual(
      calculateResult(s, questions),
    );
    s.answers[s.questionIds[4]] = "a0";
    expect(calculateResult(s, questions).category).toBe("almost-patriot");
  });
});
describe("backend-free result links", () => {
  it.each(categories)("round trips %s", (category) => {
    const r = { category, percent: 67, variant: 9 };
    expect(parseResult(resultHash(r))).toEqual(r);
  });
  it.each([
    "",
    "#quiz",
    "#result=nope&p=50&v=0",
    "#result=zrada&p=101&v=0",
    "#result=zrada&p=-1&v=0",
    "#result=zrada&p=NaN&v=0",
    "#result=zrada&p=70&v=10",
    "#result=zrada&p=70",
    "#result=<script>&p=0&v=0",
  ])("rejects invalid input: %s", (hash) =>
    expect(parseResult(hash)).toBeNull(),
  );
});
