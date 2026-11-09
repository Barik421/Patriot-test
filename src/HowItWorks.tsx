import type { Ref } from "react";
import { Icon } from "./components";
import { categories } from "./lib/quiz";
import { results } from "./data/results";

export function HowItWorks({
  onStart,
  onHome,
  headingRef,
}: {
  onStart: () => void;
  onHome: () => void;
  headingRef: Ref<HTMLHeadingElement>;
}) {
  return (
    <main id="main" className="how-page shell">
      <button className="text-button muted" onClick={onHome}>
        <Icon name="back" size={17} /> На головну
      </button>
      <section className="how-page-hero">
        <div>
          <span className="eyebrow muted">
            ВІД ПЕРШОГО «НУ ТАКЕ» ДО ВЕРДИКТУ
          </span>
          <h1 ref={headingRef} tabIndex={-1}>
            Як це
            <br />
            <span>працює?</span>
          </h1>
          <p>
            20 ситуацій із нашого життя. Твої реакції. Один із чотирьох дуже
            знайомих типажів.
          </p>
          <button className="button primary" onClick={onStart}>
            Пройти тест <Icon name="arrow" />
          </button>
        </div>
        <div className="how-page-note">
          <span aria-hidden="true">🧐</span>
          <strong>
            П’ять хвилин.
            <br />І ще пів години
            <br />
            обговорень у чаті.
          </strong>
          <p>
            Без реєстрації. Без підготовки.
            <br />
            Просто відповідай як відчуваєш.
          </p>
        </div>
      </section>
      <section className="how-page-section" aria-labelledby="how-steps-title">
        <span className="eyebrow muted">УСЕ ДОВОЛІ ПРОСТО</span>
        <h2 id="how-steps-title">Три кроки — і ти себе впізнав.</h2>
        <ol className="how-page-steps">
          <li>
            <span>01</span>
            <h3>Обери свою реакцію</h3>
            <p>
              Для кожного проходження беремо 20 різних запитань із бази зі 120.
              На екрані — одне запитання й чотири відповіді. Їхній порядок
              щоразу перемішується.
            </p>
          </li>
          <li>
            <span>02</span>
            <h3>Дійди до результату</h3>
            <p>
              Можеш повернутися кнопкою «Назад» і змінити будь-яку відповідь.
              Коли відповіси на всі 20 запитань, отримаєш свій типаж і його
              відсоток.
            </p>
          </li>
          <li>
            <span>03</span>
            <h3>Скинь друзям</h3>
            <p>
              Завантаж PNG для сторіз або квадратної публікації. Натисни
              «Поділитися» чи скопіюй посилання — друзі побачать твій результат
              без проходження тесту.
            </p>
          </li>
        </ol>
      </section>
      <section
        className="how-page-section how-scoring"
        aria-labelledby="how-scoring-title"
      >
        <div>
          <span className="eyebrow muted">ТРОХИ МАТЕМАТИКИ ПІД КАПОТОМ</span>
          <h2 id="how-scoring-title">Звідки береться твій типаж?</h2>
          <p>
            Кожна відповідь додає бали кільком типажам. Наприкінці перемагає
            той, що набрав найбільшу суму. Літера відповіді на це не впливає.
          </p>
          <p>
            Відсоток — це бали твого типажу від його можливого максимуму за ці
            20 запитань. Наприклад, 90 балів із можливих 120 — це 75% збігу.
          </p>
          <p>
            За однакових сум перевагу мають проміжні типажі: спершу
            «Недопатріот», далі «Недозрадойоб», потім «Патріот» і «Зрадойоб».
          </p>
        </div>
        <aside className="how-example">
          <span aria-hidden="true">💬</span>
          <h3>«Покажіть кошторис» — цілком патріотична відповідь.</h3>
          <p>
            Критика влади, вимога звітності та недовіра до красивих обіцянок
            самі по собі не додають «зради». Має значення реакція: розібратися й
            діяти чи заздалегідь знецінити будь-який результат.
          </p>
        </aside>
      </section>
      <section className="how-page-section" aria-labelledby="how-types-title">
        <span className="eyebrow muted">ЧОТИРИ ЗНАЙОМІ ГОЛОСИ В ГОЛОВІ</span>
        <h2 id="how-types-title">Хто може випасти?</h2>
        <div className="how-archetypes">
          {categories.map((category) => (
            <article key={category}>
              <span aria-hidden="true">{results[category].emoji}</span>
              <div>
                <h3>{results[category].name}</h3>
                <p>
                  {
                    {
                      patriot:
                        "Причетність і дієвість: цінуєш своє, питаєш за косяки та берешся щось змінити.",
                      "almost-patriot":
                        "Побутовий прагматизм: цінуєш зручність, живеш своє життя й допомагаєш без зайвого пафосу.",
                      "almost-zrada":
                        "Насторожений скепсис: спершу шукаєш підступ, але здатен визнати хороший результат.",
                      zrada:
                        "Тотальне «я ж казав»: навіть успіх здається підозрілим, а архів невиконаних обіцянок завжди під рукою.",
                    }[category]
                  }
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section
        className="how-page-practical"
        aria-label="Прогрес і приватність"
      >
        <div>
          <Icon name="check" />
          <h3>Оновив сторінку? Продовжуй.</h3>
          <p>
            Зберігаємо незавершений тест у твоєму браузері. На головній буде
            кнопка «Продовжити». Якщо сховище браузера заблоковане, залиш
            сторінку відкритою до завершення.
          </p>
        </div>
        <div>
          <Icon name="link" />
          <h3>Твої відповіді залишаються в тебе.</h3>
          <p>
            Без акаунтів і надсилання відповідей на сервер. У посиланні на
            результат — лише типаж, відсоток і варіант опису. Повторне
            проходження дає новий випадковий набір.
          </p>
        </div>
      </section>
      <section className="how-page-cta">
        <span className="eyebrow muted">ТЕОРІЮ ЗАКІНЧИЛИ</span>
        <h2>А тепер — як би вчинив ти?</h2>
        <button className="button primary" onClick={onStart}>
          Пройти тест <Icon name="arrow" />
        </button>
      </section>
    </main>
  );
}
