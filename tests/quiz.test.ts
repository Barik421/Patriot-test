import { describe, expect, it } from "vitest";
import { questions } from "../src/data/questions";
import { results } from "../src/data/results";
import {
  calculateResult,
  categories,
  newSession,
  QUIZ_LENGTH,
  parseResult,
  resultHash,
  shuffle,
  validSession,
} from "../src/lib/quiz";

describe("editorial database", () => {
  it("mixes archetypes across editorial letters and invalidates previous content revisions", () => {
    for (let position = 0; position < 3; position++) {
      const leaders = new Set(
        questions.flatMap((q) => {
          const weights = q.answers[position]?.weights;
          return weights ? [weights.indexOf(Math.max(...weights))] : [];
        }),
      );
      expect(leaders.size).toBe(4);
    }
    expect(
      validSession({ ...newSession(questions), version: 3 }, questions),
    ).toBe(false);
  });
  it("treats anti-corruption scrutiny as constructive", () => {
    for (const id of ["q003", "q014", "q016", "q025"]) {
      const q = questions.find((q) => q.id === id)!;
      expect(q.answers.some((a) => a.weights[0] === 6)).toBe(true);
    }
  });
  it("has 40 unique questions and 118 answers, with two or three distinct answers each", () => {
    expect(questions).toHaveLength(40);
    expect(new Set(questions.map((q) => q.id)).size).toBe(40);
    expect(new Set(questions.map((q) => q.text)).size).toBe(40);
    expect(questions.reduce((total, q) => total + q.answers.length, 0)).toBe(
      118,
    );
    expect(new Set(questions.map((q) => q.answers.length))).toEqual(
      new Set([2, 3]),
    );
    for (const q of questions) {
      expect(new Set(q.answers.map((a) => a.text)).size).toBe(q.answers.length);
      expect(new Set(q.answers.map((a) => a.id)).size).toBe(q.answers.length);
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
  it("selects exactly 15 unique questions with valid shuffled answer IDs", () => {
    const signatures = new Set<string>();
    for (let i = 0; i < 250; i++) {
      const s = newSession(questions);
      expect(validSession(s, questions)).toBe(true);
      expect(new Set(s.questionIds).size).toBe(QUIZ_LENGTH);
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
    "can produce %s regardless of display order",
    (category) => {
      const i = categories.indexOf(category);
      const bank = [...questions]
        .sort(
          (a, b) =>
            Math.max(...b.answers.map((a) => a.weights[i])) -
            Math.max(...a.answers.map((a) => a.weights[i])),
        )
        .slice(0, QUIZ_LENGTH);
      const s = newSession(bank);
      for (const q of bank) {
        s.answers[q.id] = q.answers.reduce((best, a) =>
          a.weights[i] > best.weights[i] ? a : best,
        ).id;
      }
      const result = calculateResult(s, bank);
      expect(result.category).toBe(category);
      expect(result.percent).toBe(100);
      s.answerOrders.forEach((order) => order.reverse());
      expect(calculateResult(s, bank)).toEqual(result);
    },
  );
  it("restores mixed answer counts and recalculates after editing an earlier answer", () => {
    const bank = [
      ...questions.filter((q) => q.answers.length !== 3),
      ...questions.filter((q) => q.answers.length === 3),
    ].slice(0, QUIZ_LENGTH);
    const s = newSession(bank);
    expect(new Set(s.answerOrders.map((a) => a.length))).toEqual(
      new Set([2, 3]),
    );
    const i = s.answerOrders.findIndex((a) => a.length === 2);
    const malformed = structuredClone(s);
    malformed.answerOrders[i].push("a3");
    expect(validSession(malformed, bank)).toBe(false);
    bank.forEach((q) => {
      s.answers[q.id] = q.answers[0].id;
    });
    s.index = i;
    s.answers[s.questionIds[i]] = s.answerOrders[i].find(
      (id) => id !== s.answers[s.questionIds[i]],
    )!;
    const restored = JSON.parse(JSON.stringify(s));
    expect(validSession(restored, bank)).toBe(true);
    const result = calculateResult(restored, bank);
    const winner = categories.indexOf(result.category);
    const points = bank.reduce(
      (total, q) =>
        total +
        q.answers.find((a) => a.id === s.answers[q.id])!.weights[winner],
      0,
    );
    const available = bank.reduce(
      (total, q) =>
        total + Math.max(...q.answers.map((a) => a.weights[winner])),
      0,
    );
    expect(result.percent).toBe(Math.round((100 * points) / available));
  });
  it("keeps the deterministic tie preference", () => {
    const bank = questions.slice(0, QUIZ_LENGTH).map((q) => ({
      ...q,
      answers: [
        { id: "tie", text: "Tie", weights: [4, 4, 1, 0] as const },
        ...q.answers,
      ],
    }));
    const session = newSession(bank);
    bank.forEach((q) => {
      session.answers[q.id] = "tie";
    });
    expect(calculateResult(session, bank).category).toBe("almost-patriot");
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
