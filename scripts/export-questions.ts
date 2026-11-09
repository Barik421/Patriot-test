import { writeFile } from "node:fs/promises";
import { questions } from "../src/data/questions";
const content =
  "# Тест на патріота — 120 запитань для перевірки\n\nУсі запитання та варіанти відповідей у змішаному редакційному порядку. У самому тесті відповіді перемішуються ще раз для кожної сесії. Літери не відповідають типажам.\n\nДля правок можна посилатися на номер запитання та літеру відповіді. Редакція 2.\n\n" +
  questions
    .map(
      (q, i) =>
        `## ${i + 1}. ${q.text}\n\nID: ${q.id}\n\n${q.answers.map((a, j) => `- **${["А", "Б", "В", "Г"][j]}.** ${a.text}`).join("\n")}\n`,
    )
    .join("\n");
await writeFile("docs/questions-review.md", content);
console.log(
  `Exported ${questions.length} questions and ${questions.reduce((total, q) => total + q.answers.length, 0)} answers.`,
);
