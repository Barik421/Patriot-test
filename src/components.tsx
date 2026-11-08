import { faqs } from "./data/faq";
import type { CSSProperties } from "react";
import { categories } from "./lib/quiz";
import { results } from "./data/results";
export function Icon({
  name,
  size = 20,
}: {
  name:
    | "arrow"
    | "sun"
    | "moon"
    | "back"
    | "check"
    | "download"
    | "share"
    | "link"
    | "close"
    | "spark";
  size?: number;
}) {
  const paths = {
    arrow: (
      <>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </>
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
      </>
    ),
    moon: <path d="M20 14a8 8 0 0 1-10-10 8 8 0 1 0 10 10Z" />,
    back: <path d="M19 12H5m6-6-6 6 6 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    download: <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />,
    share: (
      <>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m9 10 6-4M9 14l6 4" />
      </>
    ),
    link: (
      <>
        <path d="m9 15 6-6m-4-3 2-2a5 5 0 0 1 7 7l-2 2M6 11l-2 2a5 5 0 0 0 7 7l2-2" />
      </>
    ),
    close: <path d="m6 6 12 12M6 18 18 6" />,
    spark: (
      <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z" />
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
export function Mark() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <path
        d="M17 2h6v11l8-8 4 4-8 8h11v6H27l8 8-4 4-8-8v11h-6V27l-8 8-4-4 8-8H2v-6h11L5 9l4-4 8 8Z"
        fill="currentColor"
      />
    </svg>
  );
}
export function Header({
  dark,
  onTheme,
  onHome,
  inQuiz = false,
}: {
  dark: boolean;
  onTheme: () => void;
  onHome: () => void;
  inQuiz?: boolean;
}) {
  return (
    <header className="header shell">
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onHome();
        }}
        className="brand"
        aria-label="Тест на патріота — головна"
      >
        <span className="brand-mark">
          <Mark />
        </span>
        <span>
          тест на
          <br />
          патріота<span className="brand-dot">.</span>
        </span>
      </a>
      <nav aria-label="Головна навігація">
        {!inQuiz && (
          <a href="#how" onClick={onHome}>
            Як це працює
          </a>
        )}
        <span className="header-note">Трохи правди. Багато самоіронії.</span>
        <button
          className="icon-button"
          onClick={onTheme}
          aria-label={dark ? "Увімкнути світлу тему" : "Увімкнути темну тему"}
        >
          <Icon name={dark ? "sun" : "moon"} />
        </button>
      </nav>
    </header>
  );
}
export function Home({
  onStart,
  resume,
  onResume,
}: {
  onStart: () => void;
  resume?: number;
  onResume?: () => void;
}) {
  return (
    <main id="main">
      <section className="hero shell">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="live-dot" /> НЕЗАЛЕЖНИЙ ТЕСТ. ЗАЛЕЖНИЙ ВІД МЕМІВ.
          </div>
          <h1>
            Патріот
            <br />
            чи{" "}
            <span className="underline-word">
              зрадойоб
              <svg
                viewBox="0 0 600 24"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path d="M3 15Q260 0 595 13M20 22Q320 8 570 21" />
              </svg>
            </span>
            <span className="question-dot">?</span>
          </h1>
          <p className="hero-subtitle">
            Пройди 20 запитань і дізнайся,
            <br className="desktop-br" /> хто ти насправді
            <span className="subtle">. Ну, майже.</span>
          </p>
          <div className="start-row">
            <button className="button primary start-button" onClick={onStart}>
              Пройти тест <Icon name="arrow" size={24} />
            </button>
            <span className="hand-note">
              чесно тільки
              <br />
              із самим собою <span>↙</span>
            </span>
          </div>
          {resume !== undefined && (
            <button className="resume-link" onClick={onResume}>
              Продовжити незавершений тест · {resume}/20{" "}
              <Icon name="arrow" size={16} />
            </button>
          )}
          <div className="hero-facts">
            <span>
              <i>20</i> випадкових запитань
            </span>
            <span>≈ 5 хвилин</span>
            <span>Без реєстрації</span>
          </div>
        </div>
        <div
          className="hero-art"
          aria-label="Від оптиміста до скептика — який ти сьогодні?"
          role="img"
        >
          <span className="art-orbit orbit-one" />
          <span className="art-orbit orbit-two" />
          <span className="small-spark spark-one">✳</span>
          <span className="art-label">ТВІЙ ВНУТРІШНІЙ УКРАЇНЕЦЬ</span>
          <div className="mood-card good">
            <span className="mood-tag">
              <span /> ПЕРЕМОГА
            </span>
            <span className="mood-face">😎</span>
            <span className="mood-caption">
              Все буде
              <br />
              <strong>Україна.</strong>
            </span>
            <span className="card-star">✦</span>
          </div>
          <div className="mood-card evil">
            <span className="mood-tag">
              <span /> ЗРАДА
            </span>
            <span className="mood-face">🧐</span>
            <span className="mood-caption">
              А де тут
              <br />
              <strong>підступ?</strong>
            </span>
            <span className="card-star">↗</span>
          </div>
          <div className="versus">чи?</div>
          <div className="art-sticker">
            100%<span>НЕ НАУКОВО</span>
          </div>
          <span className="art-bottom">
            У кожному з нас живуть обидва. <span>🤝</span>
          </span>
        </div>
      </section>
      <div className="ticker" aria-hidden="true">
        <div>
          ТРОХИ ЗРАДИ <span>✳</span> ТРОХИ ПЕРЕМОГИ <span>✳</span> БАГАТО
          САМООІРОНІЇ <span>✳</span> ЦЕ ПРО НАС <span>✳</span> ТРОХИ ЗРАДИ{" "}
          <span>✳</span> ТРОХИ ПЕРЕМОГИ <span>✳</span> БАГАТО САМООІРОНІЇ{" "}
          <span>✳</span>
        </div>
      </div>
      <section className="types-section shell" id="types">
        <div className="section-heading">
          <div>
            <span className="eyebrow muted">
              ЧОТИРИ ВІДТІНКИ НАШОГО «НУ ТАКЕ»
            </span>
            <h2>То хто ти сьогодні?</h2>
          </div>
          <p>
            Без правильних відповідей.
            <br />
            Але з дуже впізнаваними результатами.
          </p>
        </div>
        <div className="types-grid">
          {categories.map((key, i) => {
            const r = results[key];
            return (
              <article
                className={`type-card type-${key}`}
                key={key}
                style={
                  {
                    "--card-color": r.color,
                    "--card-ink": r.ink,
                  } as CSSProperties
                }
              >
                <div className="type-top">
                  <span className="type-number">0{i + 1}</span>
                  <Icon name="arrow" size={19} />
                </div>
                <span className="type-emoji" aria-hidden="true">
                  {r.emoji}
                </span>
                <h3>{r.name}</h3>
                <p>{r.slogan}</p>
                <span className="type-bottom">
                  {
                    [
                      "Оптимізм — твоя суперсила",
                      "Баланс десь біля кави",
                      "Скепсис із людським обличчям",
                      "«Я ж казав» — твій подкаст",
                    ][i]
                  }
                </span>
              </article>
            );
          })}
        </div>
        <p className="types-footnote">
          Жоден результат не робить тебе кращим чи гіршим. Це просто жарт.{" "}
          <span>🫶</span>
        </p>
      </section>
      <section className="how-section shell" id="how">
        <div className="how-intro">
          <span className="eyebrow muted">БЕЗ ІСПИТІВ І КОНСПЕКТІВ</span>
          <h2>
            П’ять хвилин.
            <br />І все про тебе.
          </h2>
          <p>
            Тут не питають дати битв. Тут питають,
            <br />
            що ти думаєш, коли знову розкопали дорогу.
          </p>
          <button className="text-button" onClick={onStart}>
            Ну все, я готовий <Icon name="arrow" />
          </button>
        </div>
        <ol className="steps">
          <li>
            <span>01</span>
            <div>
              <h3>Відповідай як відчуваєш</h3>
              <p>
                20 випадкових запитань із життя. Обирай те, що найближче тобі, а
                не «як правильно».
              </p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <h3>Зустрінь свого внутрішнього українця</h3>
              <p>
                Ми змішаємо трохи математики й багато самоіронії. Отримаєш один
                із чотирьох типажів.
              </p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <h3>Відправ у чат. Почни дискусію.</h3>
              <p>
                Збережи картку для сторіз або скинь посилання друзям. Хай теж
                перевірять себе.
              </p>
            </div>
          </li>
        </ol>
      </section>
      <section className="faq-section shell" id="faq">
        <div className="section-heading">
          <div>
            <span className="eyebrow muted">ПЕРЕД ТИМ ЯК ЗНАЙТИ ЗРАДУ</span>
            <h2>Є питання? Є відповіді.</h2>
          </div>
          <span className="faq-doodle" aria-hidden="true">
            ↙
          </span>
        </div>
        <div className="faqs">
          {faqs.map(([q, a]) => (
            <details key={q}>
              <summary>
                {q}
                <span aria-hidden="true">+</span>
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="last-cta shell">
        <span aria-hidden="true">✳</span>
        <h2>
          Ну що, перевіримо
          <br />
          твоє «все пропало»?
        </h2>
        <button className="button dark-button" onClick={onStart}>
          Пройти тест <Icon name="arrow" />
        </button>
        <p>Безкоштовно. Анонімно. З любов’ю та сарказмом.</p>
      </section>
    </main>
  );
}
export function Footer({ onPrivacy }: { onPrivacy: () => void }) {
  return (
    <footer className="footer shell">
      <p>
        Зроблено з <span>💙</span> та здоровою самоіронією.
      </p>
      <span>© {new Date().getFullYear()} Тест на патріота</span>
      <button onClick={onPrivacy}>Приватність</button>
      <a href="#faq">Це точно жарт?</a>
    </footer>
  );
}
