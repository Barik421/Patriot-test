export const categories = [
  "patriot",
  "almost-patriot",
  "almost-zrada",
  "zrada",
] as const;
export type Category = (typeof categories)[number];
export type Weights = readonly [number, number, number, number];
export interface Answer {
  id: string;
  text: string;
  weights: Weights;
}
export interface Question {
  id: string;
  text: string;
  answers: Answer[];
}
export interface Session {
  version: 2;
  id: string;
  questionIds: string[];
  answerOrders: string[][];
  answers: Record<string, string>;
  index: number;
}
export interface Result {
  category: Category;
  percent: number;
  variant: number;
}
export const QUIZ_LENGTH = 20;
export function shuffle<T>(items: readonly T[], rng = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
export function newSession(bank: Question[]): Session {
  if (bank.length < QUIZ_LENGTH) throw new Error("Not enough questions");
  const selected = shuffle(bank).slice(0, QUIZ_LENGTH);
  return {
    version: 2,
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    questionIds: selected.map((q) => q.id),
    answerOrders: selected.map((q) => shuffle(q.answers.map((a) => a.id))),
    answers: {},
    index: 0,
  };
}
export function validSession(
  value: unknown,
  bank: Question[],
): value is Session {
  if (!value || typeof value !== "object") return false;
  const s = value as Session;
  if (
    s.version !== 2 ||
    typeof s.id !== "string" ||
    !Array.isArray(s.questionIds) ||
    s.questionIds.length !== QUIZ_LENGTH ||
    new Set(s.questionIds).size !== QUIZ_LENGTH ||
    !Array.isArray(s.answerOrders) ||
    s.answerOrders.length !== QUIZ_LENGTH ||
    !s.answers ||
    typeof s.answers !== "object" ||
    !Number.isInteger(s.index) ||
    s.index < 0 ||
    s.index >= QUIZ_LENGTH
  )
    return false;
  return (
    s.questionIds.every((id, i) => {
      const q = bank.find((q) => q.id === id),
        order = s.answerOrders[i];
      return (
        !!q &&
        Array.isArray(order) &&
        order.length === 4 &&
        new Set(order).size === 4 &&
        order.every((a) => q.answers.some((x) => x.id === a))
      );
    }) &&
    Object.entries(s.answers).every(
      ([q, a]) =>
        s.questionIds.includes(q) &&
        bank.find((x) => x.id === q)?.answers.some((x) => x.id === a),
    ) &&
    s.questionIds.slice(0, s.index).every((id) => !!s.answers[id])
  );
}
export function calculateResult(session: Session, bank: Question[]): Result {
  if (
    !validSession(session, bank) ||
    session.questionIds.some((id) => !session.answers[id])
  )
    throw new Error("Incomplete quiz");
  const totals = [0, 0, 0, 0];
  let hash = 0;
  for (const id of session.questionIds) {
    const answer = bank
      .find((q) => q.id === id)!
      .answers.find((a) => a.id === session.answers[id])!;
    answer.weights.forEach((w, i) => {
      totals[i] += w;
    });
    for (const char of id + answer.id)
      hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  // Stable ties prefer the inner, less absolute archetypes: almost-patriot, almost-zrada, patriot, zrada.
  const winner = [1, 2, 0, 3].reduce(
    (best, i) => (totals[i] > totals[best] ? i : best),
    1,
  );
  return {
    category: categories[winner],
    percent: Math.round((totals[winner] / (QUIZ_LENGTH * 6)) * 100),
    variant: hash % 10,
  };
}
export function resultHash(r: Result): string {
  return `#result=${r.category}&p=${r.percent}&v=${r.variant}`;
}
export function parseResult(hash: string): Result | null {
  const p = new URLSearchParams(hash.replace(/^#/, ""));
  const category = p.get("result"),
    percent = p.get("p"),
    variant = p.get("v");
  if (
    !categories.includes(category as Category) ||
    !percent ||
    !/^\d{1,3}$/.test(percent) ||
    Number(percent) > 100 ||
    !variant ||
    !/^\d$/.test(variant)
  )
    return null;
  return {
    category: category as Category,
    percent: Number(percent),
    variant: Number(variant),
  };
}
