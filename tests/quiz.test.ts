import { describe, expect, it } from "vitest";
import { questions } from "../src/data/questions";
import { results } from "../src/data/results";
import {
  calculateResult,
  categories,
  newSession,
  QUIZ_LENGTH,
  QUIZ_MAX_SCORE,
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
          const answer = q.answers[position];
          return answer ? [answer.score] : [];
        }),
      );
      expect(leaders.size).toBe(4);
    }
    expect(
      validSession({ ...newSession(questions), version: 5 }, questions),
    ).toBe(false);
  });
  it("treats anti-corruption scrutiny as constructive", () => {
    for (const id of ["q003", "q014", "q016", "q025"]) {
      const q = questions.find((q) => q.id === id)!;
      expect(q.answers.some((a) => a.score === 0)).toBe(true);
    }
  });
  it("has 40 unique questions and 120 answers, with three distinct answers each", () => {
    expect(questions).toHaveLength(40);
    expect(new Set(questions.map((q) => q.id)).size).toBe(40);
    expect(new Set(questions.map((q) => q.text)).size).toBe(40);
    expect(questions.reduce((total, q) => total + q.answers.length, 0)).toBe(
      120,
    );
    expect(new Set(questions.map((q) => q.answers.length))).toEqual(
      new Set([3]),
    );
    for (const q of questions) {
      expect(new Set(q.answers.map((a) => a.text)).size).toBe(q.answers.length);
      expect(new Set(q.answers.map((a) => a.id)).size).toBe(q.answers.length);
      for (const a of q.answers) {
        expect([0, 1, 2, 3]).toContain(a.score);
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
function scaleFixture(scores: number[]) {
  expect(scores).toHaveLength(QUIZ_LENGTH);
  const bank = questions.slice(0, QUIZ_LENGTH).map((q) => ({
    ...q,
    answers: ([0, 1, 2, 3] as const).map((score) => ({
      id: `s${score}`,
      text: `Reaction ${score}`,
      score,
    })),
  }));
  const session = newSession(bank);
  bank.forEach((q, i) => {
    session.answers[q.id] = `s${scores[i]}`;
  });
  return { bank, session, result: calculateResult(session, bank) };
}
function scoresTotaling(total: number) {
  return Array.from({ length: QUIZ_LENGTH }, () => {
    const score = Math.min(3, total);
    total -= score;
    return score;
  });
}
describe("fixed reaction scale", () => {
  it.each([
    [0, "patriot", 0],
    [1, "almost-patriot", 33],
    [2, "almost-zrada", 67],
    [3, "zrada", 100],
  ] as const)(
    "maps consistent level %i reactions to %s",
    (score, category, percent) => {
      expect(scaleFixture(Array(QUIZ_LENGTH).fill(score)).result).toMatchObject(
        {
          category,
          percent,
          score: score * QUIZ_LENGTH,
        },
      );
    },
  );
  it.each([
    [11, "patriot", 24],
    [12, "almost-patriot", 27],
    [22, "almost-patriot", 49],
    [23, "almost-zrada", 51],
    [33, "almost-zrada", 73],
    [34, "zrada", 76],
  ] as const)(
    "classifies boundary score %i as %s before display rounding",
    (score, category, percent) => {
      expect(scaleFixture(scoresTotaling(score)).result).toMatchObject({
        score,
        category,
        percent,
      });
    },
  );
  it.each([
    [12, 3, "patriot", 20],
    [10, 5, "almost-patriot", 33],
    [7, 8, "almost-zrada", 53],
    [3, 12, "zrada", 80],
  ] as const)(
    "maps %i constructive and %i dismissive reactions to %s",
    (positive, negative, category, percent) => {
      expect(
        scaleFixture([...Array(positive).fill(0), ...Array(negative).fill(3)])
          .result,
      ).toMatchObject({ category, percent });
    },
  );
  it.each([
    ["q004", "a2"],
    ["q042", "a1"],
    ["q044", "a1"],
    ["q039", "a1"],
  ])(
    "does not score accountability or fact-checking as zrada: %s/%s",
    (qid, aid) => {
      expect(
        questions.find((q) => q.id === qid)!.answers.find((a) => a.id === aid)!
          .score,
      ).toBe(0);
    },
  );
  it.each([
    ["q007", "a1"],
    ["q012", "a1"],
    ["q057", "a2"],
    ["q023", "a2"],
  ])("retains a high score for explicit total dismissal: %s/%s", (qid, aid) => {
    expect(
      questions.find((q) => q.id === qid)!.answers.find((a) => a.id === aid)!
        .score,
    ).toBe(3);
  });
  it("keeps both extremes attainable across 100 real question draws", () => {
    let seed = 12345;
    const rng = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let draw = 0; draw < 100; draw++) {
      const bank = shuffle(questions, rng).slice(0, QUIZ_LENGTH);
      for (const extreme of ["minimum", "maximum"] as const) {
        const s = newSession(bank);
        for (const q of bank) {
          s.answers[q.id] = q.answers.reduce((best, a) =>
            (
              extreme === "minimum"
                ? a.score < best.score
                : a.score > best.score
            )
              ? a
              : best,
          ).id;
        }
        const result = calculateResult(s, bank);
        expect(result.category).toBe(
          extreme === "minimum" ? "patriot" : "zrada",
        );
        s.answerOrders.forEach((order) => order.reverse());
        expect(calculateResult(s, bank)).toEqual(result);
      }
    }
  });
  it("never lowers zrada when selected scores increase", () => {
    let previousPercent = -1,
      previousCategory = -1;
    for (let total = 0; total <= QUIZ_MAX_SCORE; total++) {
      const r = scaleFixture(scoresTotaling(total)).result;
      expect(r.percent).toBeGreaterThanOrEqual(previousPercent);
      expect(categories.indexOf(r.category)).toBeGreaterThanOrEqual(
        previousCategory,
      );
      previousPercent = r.percent;
      previousCategory = categories.indexOf(r.category);
    }
  });
  it("ignores the scores and number of unselected alternatives", () => {
    const { bank, session, result } = scaleFixture(Array(QUIZ_LENGTH).fill(1));
    const altered = bank.map((q) => ({
      ...q,
      answers: q.answers
        .filter((a) => a.id !== "s3")
        .map((a) => (a.id === "s1" ? a : { ...a, score: 0 as const })),
    }));
    const restored = {
      ...session,
      answerOrders: session.questionIds.map((id) =>
        altered.find((q) => q.id === id)!.answers.map((a) => a.id),
      ),
    };
    expect(validSession(restored, altered)).toBe(true);
    expect(calculateResult(restored, altered)).toEqual(result);
  });
  it("restores mixed answer counts and replaces an earlier answer's contribution", () => {
    const { bank, session } = scaleFixture(Array(QUIZ_LENGTH).fill(0));
    bank[0].answers = bank[0].answers.filter(
      (a) => a.id === "s0" || a.id === "s3",
    );
    session.answerOrders = session.questionIds.map((id) =>
      bank.find((q) => q.id === id)!.answers.map((a) => a.id),
    );
    const malformed = structuredClone(session);
    malformed.answerOrders[session.questionIds.indexOf(bank[0].id)].push("s9");
    expect(validSession(malformed, bank)).toBe(false);
    session.answers[bank[0].id] = "s3";
    const restored = JSON.parse(JSON.stringify(session));
    expect(validSession(restored, bank)).toBe(true);
    expect(calculateResult(restored, bank)).toMatchObject({
      score: 3,
      percent: 7,
    });
    restored.answers[bank[0].id] = "s0";
    expect(calculateResult(restored, bank)).toMatchObject({
      score: 0,
      percent: 0,
    });
  });
});
describe("backend-free result links", () => {
  it.each(categories)("round trips %s", (category) => {
    const r = { category, percent: 67, variant: 9 };
    expect(parseResult(resultHash(r))).toEqual(r);
  });
  it.each([0, 11, 12, 22, 23, 33, 34, 45])(
    "round trips scale score %i",
    (score) => {
      const r = scaleFixture(scoresTotaling(score)).result;
      expect(parseResult(resultHash(r))).toEqual(r);
    },
  );
  it.each([
    "#result=patriot&p=0&v=0&score=-1",
    "#result=zrada&p=100&v=0&score=46",
    "#result=patriot&p=0&v=0&score=1.5",
    "#result=patriot&p=0&v=0&score=",
    "#result=patriot&p=0&v=0&score=15",
    "#result=patriot&p=33&v=0&score=15",
    "#result=almost-patriot&p=34&v=0&score=15",
  ])("rejects malformed or inconsistent scale result: %s", (hash) =>
    expect(parseResult(hash)).toBeNull(),
  );
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
