import { isHowPath, publicPaths } from "./lib/paths";
import { HowItWorks } from "./HowItWorks";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Footer, Header, Home, Icon, Mark } from "./components";
import { questions } from "./data/questions";
import { results } from "./data/results";
import {
  calculateResult,
  newSession,
  parseResult,
  resultHash,
  validSession,
} from "./lib/quiz";
import type { Result, Session } from "./lib/quiz";
import { readStorage, writeStorage } from "./lib/storage";
import {
  analyticsAvailable,
  consent,
  initializeAnalytics,
  setConsent,
  track,
} from "./lib/analytics";
import {
  copyText,
  downloadBlob,
  resultImage,
  shareResult,
  shareUrl,
} from "./lib/share";
import type { CardFormat } from "./lib/share";
type View = "home" | "how" | "quiz" | "loading" | "result";
function restoredSession(): Session | null {
  try {
    const data = JSON.parse(readStorage("session") || "null");
    return validSession(data, questions) ? data : null;
  } catch {
    return null;
  }
}
function initial(
  staticPage?: "home" | "how",
  base = import.meta.env?.BASE_URL || "/",
) {
  const session = restoredSession();
  const result =
    typeof location !== "undefined" ? parseResult(location.hash) : null;
  return {
    session,
    result,
    view: (staticPage
      ? staticPage
      : result
        ? "result"
        : typeof location !== "undefined" &&
            (location.hash === "#how" || isHowPath(location.pathname, base))
          ? "how"
          : typeof location !== "undefined" &&
              location.hash === "#quiz" &&
              session
            ? "quiz"
            : "home") as View,
  };
}
function scrollTop() {
  window.scrollTo({ top: 0, behavior: "instant" });
}
export default function App({
  staticPage,
  basePath = import.meta.env?.BASE_URL || "/",
}: { staticPage?: "home" | "how"; basePath?: string } = {}) {
  const paths = publicPaths(basePath);
  const [state, setState] = useState(() => initial(staticPage, basePath)),
    { session, result, view } = state;
  const [dark, setDark] = useState(
    () =>
      typeof document !== "undefined" &&
      document.documentElement.dataset.theme === "dark",
  );
  const [toast, setToast] = useState("");
  const [privacy, setPrivacy] = useState(false);
  const [consentOpen, setConsentOpen] = useState(
    () => typeof window !== "undefined" && analyticsAvailable() && !consent(),
  );
  const [format, setFormat] = useState<CardFormat>("story");
  const [busy, setBusy] = useState(false);
  const [manualLink, setManualLink] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null),
    dialog = useRef<HTMLDialogElement>(null);
  const lastView = useRef("");
  const lastFocus = useRef("");
  const pendingResult = useRef<Result | null>(null);
  const originalTitle = "Патріот чи зрадойоб? — Тест на патріота України";
  useEffect(() => {
    initializeAnalytics();
    if (location.hash === "#how") {
      location.replace(publicPaths(basePath).how);
      return;
    }
    const onHash = () => {
      if (location.hash === "#main") return;
      if (location.hash === "#how") {
        location.assign(publicPaths(basePath).how);
        return;
      }
      const next = initial(undefined, basePath);
      setState(next);
      setManualLink(false);
      if (location.hash !== "#faq") scrollTop();
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [basePath]);
  useEffect(() => {
    if (view === "home" && location.hash === "#faq") {
      document.getElementById("faq")?.scrollIntoView({ behavior: "instant" });
    }
  }, [state, view]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (privacy) dialog.current?.showModal();
    else dialog.current?.close();
  }, [privacy]);
  useEffect(() => {
    const signature = `${session?.id}:${session?.index}`;
    if (view === "quiz" && session && lastView.current !== signature) {
      track("quiz_question_view", { question_number: session.index + 1 });
      lastView.current = signature;
    }
    const focusKey = `${view}:${session?.index}`;
    if (view !== "home" && lastFocus.current !== focusKey)
      heading.current?.focus({ preventScroll: true });
    lastFocus.current = focusKey;
    document.title =
      view === "result" && result
        ? `${results[result.category].name} — Тест на патріота`
        : view === "how"
          ? "Як працює тест на патріота — правила, результати й поширення"
          : originalTitle;
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (
      (view !== "home" && view !== "how") ||
      location.hash === "#quiz" ||
      location.hash.startsWith("#result=")
    ) {
      if (!robots) {
        robots = document.createElement("meta");
        robots.name = "robots";
        document.head.append(robots);
      }
      robots.content = "noindex,follow";
    } else if (import.meta.env?.VITE_SITE_URL) robots?.remove();
  }, [view, session, result]);
  useEffect(() => {
    if (view !== "loading") return;
    const step = setInterval(() => setLoadingStep((s) => (s + 1) % 3), 550);
    const timer = setTimeout(() => {
      const r = pendingResult.current;
      if (!r) return;
      writeStorage("session", null);
      history.replaceState(null, "", resultHash(r));
      setState({ session: null, result: r, view: "result" });
      track("quiz_result", { category: r.category, score: r.percent });
      scrollTop();
    }, 1900);
    return () => {
      clearInterval(step);
      clearTimeout(timer);
    };
  }, [view]);
  const save = (next: Session) => {
    if (!writeStorage("session", JSON.stringify(next)))
      setToast(
        "Браузер не дозволяє зберегти прогрес. Залиш цю сторінку відкритою до кінця тесту.",
      );
    setState({ session: next, result: null, view: "quiz" });
  };
  const start = (restart = false) => {
    const next = newSession(questions);
    save(next);
    track(restart ? "quiz_restart" : "quiz_start");
    if (view === "how") {
      location.assign(`${paths.home}#quiz`);
      return;
    }
    history.pushState(null, "", `${paths.home}#quiz`);
    scrollTop();
    setManualLink(false);
  };
  const home = () => {
    if (view === "how") {
      location.assign(paths.home);
      return;
    }
    setState((s) => ({ ...s, view: "home", result: null }));
    history.pushState(null, "", paths.home);
    scrollTop();
  };
  const resume = () => {
    if (!session) return;
    setState((s) => ({ ...s, view: "quiz" }));
    history.pushState(null, "", "#quiz");
    scrollTop();
  };
  const toggleTheme = () => {
    const value = !dark;
    setDark(value);
    document.documentElement.dataset.theme = value ? "dark" : "light";
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", value ? "#14171e" : "#f6f5f0");
    writeStorage("theme", value ? "dark" : "light");
    track("theme_change", { theme: value ? "dark" : "light" });
  };
  const choose = (id: string) => {
    if (session)
      save({
        ...session,
        answers: {
          ...session.answers,
          [session.questionIds[session.index]]: id,
        },
      });
  };
  const next = () => {
    if (!session || !session.answers[session.questionIds[session.index]])
      return;
    if (session.index < 19) {
      save({ ...session, index: session.index + 1 });
      scrollTop();
    } else {
      const r = calculateResult(session, questions);
      pendingResult.current = r;
      setLoadingStep(0);
      setState((s) => ({ ...s, view: "loading" }));
      track("quiz_complete");
      scrollTop();
    }
  };
  const back = () => {
    if (session && session.index > 0) {
      save({ ...session, index: session.index - 1 });
      scrollTop();
    }
  };
  useEffect(() => {
    if (view !== "quiz" || !session) return;
    const onKey = (event: KeyboardEvent) => {
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      )
        return;
      const n = Number(event.key);
      if (n >= 1 && n <= 4) {
        event.preventDefault();
        const id = session.answerOrders[session.index][n - 1];
        const next = {
          ...session,
          answers: {
            ...session.answers,
            [session.questionIds[session.index]]: id,
          },
        };
        writeStorage("session", JSON.stringify(next));
        setState({ session: next, result: null, view: "quiz" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [session, view]);
  const copy = async () => {
    if (!result) return;
    const ok = await copyText(shareUrl(result));
    if (ok) {
      setToast("Посилання скопійовано. Нехай друзі теж себе перевірять 🙂");
      track("result_share", { method: "copy_link", category: result.category });
    } else {
      setManualLink(true);
      setToast("Скопіюй посилання з поля нижче.");
    }
  };
  const download = async () => {
    if (!result || busy) return;
    setBusy(true);
    try {
      const blob = await resultImage(result, format);
      downloadBlob(blob, `patriot-${result.category}-${format}.png`);
      track("result_download", { format, category: result.category });
      setToast("Картку збережено. Вона готова до твоїх сторіз.");
    } catch {
      setToast(
        "Не вдалося створити картинку. Спробуй ще раз або скопіюй посилання.",
      );
    } finally {
      setBusy(false);
    }
  };
  const share = async () => {
    if (!result) return;
    const method = await shareResult(result);
    if (method === "cancelled") return;
    if (method === "copied")
      setToast("Посилання скопійовано. Нехай друзі теж себе перевірять 🙂");
    if (method === "manual") {
      setManualLink(true);
      setToast("Скопіюй посилання з поля нижче.");
    } else
      track("result_share", {
        method: method === "native" ? "native" : "copy_link",
        category: result.category,
      });
  };
  const info = result ? results[result.category] : null;
  const current = session
    ? questions.find((q) => q.id === session.questionIds[session.index])!
    : null;
  const answer = session && current ? session.answers[current.id] : null;
  return (
    <>
      <a className="skip-link" href="#main">
        До основного вмісту
      </a>
      <Header
        dark={dark}
        onTheme={toggleTheme}
        onHome={home}
        basePath={paths.home}
        inQuiz={view === "quiz" || view === "loading" || view === "result"}
      />
      {view === "how" && (
        <HowItWorks
          onStart={() => start()}
          onHome={home}
          headingRef={heading}
        />
      )}
      {view === "home" && (
        <Home
          onStart={() => start()}
          resume={session ? Object.keys(session.answers).length : undefined}
          onResume={resume}
        />
      )}
      {view === "quiz" && session && current && (
        <main id="main" className="quiz-main shell">
          <div className="quiz-topline">
            <button className="text-button muted" onClick={home}>
              <Icon name="close" size={16} /> Зберегти й вийти
            </button>
          </div>
          <div className="quiz-content">
            <div className="progress-label">
              <span>
                Питання <strong>{session.index + 1}</strong> із 20
              </span>
              <span>
                {Math.round((Object.keys(session.answers).length / 20) * 100)}%
              </span>
            </div>
            <div
              className="progress"
              role="progressbar"
              aria-label="Прогрес тесту"
              aria-valuenow={Object.keys(session.answers).length}
              aria-valuemin={0}
              aria-valuemax={20}
            >
              <span
                style={{ width: `${Object.keys(session.answers).length * 5}%` }}
              />
            </div>
            <div className="question-block" key={current.id}>
              <span className="eyebrow muted">
                ВІДПОВІДАЙ ЧЕСНО. МИ НЕ ЗАСУДЖУЄМО.
              </span>
              <h1 ref={heading} tabIndex={-1}>
                {current.text}
              </h1>
              <div
                className="answer-list"
                role="group"
                aria-label="Варіанти відповіді"
              >
                {session.answerOrders[session.index].map((id, i) => {
                  const a = current.answers.find((a) => a.id === id)!;
                  return (
                    <button
                      key={id}
                      className={`answer-card ${answer === id ? "selected" : ""}`}
                      aria-pressed={answer === id}
                      onClick={() => choose(id)}
                    >
                      <span className="answer-letter">
                        {["А", "Б", "В", "Г"][i]}
                      </span>
                      <span>{a.text}</span>
                      <span className="answer-check">
                        {answer === id ? (
                          <Icon name="check" size={17} />
                        ) : (
                          <span />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="quiz-controls">
              <button
                className="button secondary"
                onClick={back}
                disabled={session.index === 0}
              >
                <Icon name="back" /> Назад
              </button>
              <span className="keyboard-tip">Можна обирати клавішами 1–4</span>
              <button
                className="button primary"
                disabled={!answer}
                onClick={next}
              >
                {session.index === 19 ? "Мій результат" : "Далі"}
                <Icon name="arrow" />
              </button>
            </div>
            <p className="quiz-bottom-note">
              <Icon name="check" size={15} /> Відповідь можна змінити.
              Самоіронію — теж.
            </p>
          </div>
        </main>
      )}
      {view === "loading" && (
        <main id="main" className="loading-screen shell">
          <div className="loading-mark">
            <Mark />
          </div>
          <span className="eyebrow muted">
            ЗРАДА ЧИ ПЕРЕМОГА? ЗАРАЗ З’ЯСУЄМО.
          </span>
          <h1 ref={heading} tabIndex={-1} aria-live="polite">
            {
              [
                "Аналізуємо рівень зради…",
                "Звіряємо з думкою кота…",
                "Додаємо дрібку самоіронії…",
              ][loadingStep]
            }
          </h1>
          <p>Твій внутрішній стан майже визначено.</p>
          <div className="loading-dots">
            <i />
            <i />
            <i />
          </div>
        </main>
      )}
      {view === "result" && result && info && (
        <main
          id="main"
          className={`result-main result-${result.category}`}
          style={
            {
              "--result-color": info.color,
              "--result-ink": info.ink,
            } as CSSProperties
          }
        >
          <div className="result-effects" aria-hidden="true">
            {Array.from({ length: 14 }, (_, i) => (
              <span
                key={i}
                style={
                  {
                    "--i": i,
                    "--x": `${(i * 29 + 7) % 100}%`,
                    "--delay": `${i * -0.67}s`,
                  } as CSSProperties
                }
              >
                {info.extras[i % 4]}
              </span>
            ))}
          </div>
          <div className="result-content shell">
            <div className="result-intro">
              <span className="eyebrow">
                ВЕРДИКТ ВИНЕСЕНО. АПЕЛЯЦІЯ — В КОМЕНТАРЯХ.
              </span>
              <span className="result-emoji" aria-hidden="true">
                {info.emoji}
              </span>
              <p className="result-eyebrow">{info.eyebrow}</p>
              <h1 ref={heading} tabIndex={-1}>
                Ти — {info.name}
                <span>!</span>
              </h1>
              <p className="result-description">
                {info.descriptions[result.variant]}
              </p>
              <div className="score-pill">
                <strong>{result.percent}%</strong>
                <span>збіг із типажем</span>
              </div>
            </div>
            <section
              className="result-share-panel"
              aria-label="Поділитися результатом"
            >
              <div>
                <h2>Це має побачити твій чат.</h2>
                <p>Збережи собі. Скинь друзям. Сперечайтесь із любов’ю.</p>
              </div>
              <div className="share-form">
                <fieldset className="format-picker">
                  <legend>Формат картки</legend>
                  <label>
                    <input
                      type="radio"
                      name="format"
                      checked={format === "story"}
                      onChange={() => setFormat("story")}
                    />
                    <span>
                      Сторіз <small>9:16</small>
                    </span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="format"
                      checked={format === "square"}
                      onChange={() => setFormat("square")}
                    />
                    <span>
                      Квадрат <small>1:1</small>
                    </span>
                  </label>
                </fieldset>
                <button
                  className="button primary"
                  onClick={download}
                  disabled={busy}
                >
                  <Icon name="download" />
                  {busy ? "Малюємо картку…" : "Завантажити картинку"}
                </button>
                <div className="share-row">
                  <button className="button secondary" onClick={share}>
                    <Icon name="share" />
                    Поділитися
                  </button>
                  <button className="button secondary" onClick={copy}>
                    <Icon name="link" />
                    Копіювати посилання
                  </button>
                </div>
                {manualLink && (
                  <label className="manual-link">
                    Твоє посилання
                    <input
                      readOnly
                      value={shareUrl(result)}
                      onFocus={(e) => e.target.select()}
                    />
                  </label>
                )}
              </div>
            </section>
            <div className="result-after">
              <button className="text-button" onClick={() => start(true)}>
                Пройти ще раз <Icon name="arrow" />
              </button>
              <button className="text-button muted" onClick={home}>
                На головну
              </button>
            </div>
          </div>
        </main>
      )}
      <Footer onPrivacy={() => setPrivacy(true)} basePath={paths.home} />
      <div className="toast" role="status" aria-live="polite">
        {toast && <span>{toast}</span>}
      </div>
      {consentOpen && (
        <aside className="consent-banner" aria-label="Налаштування аналітики">
          <div>
            <strong>Трохи статистики?</strong>
            <p>
              Лише за твоєю згодою збираємо статистику використання. Відповіді
              залишаються у браузері. Відмова не впливає на тест.
            </p>
          </div>
          <button
            className="button secondary"
            onClick={() => {
              setConsent(false);
              setConsentOpen(false);
            }}
          >
            Відхилити
          </button>
          <button
            className="button primary"
            onClick={() => {
              setConsent(true);
              setConsentOpen(false);
            }}
          >
            Дозволити
          </button>
        </aside>
      )}
      <dialog
        className="privacy-dialog"
        ref={dialog}
        onCancel={() => setPrivacy(false)}
        onClick={(e) => {
          if (e.target === dialog.current) setPrivacy(false);
        }}
      >
        <div className="dialog-top">
          <span className="eyebrow muted">БЕЗ ТАЄМНИХ ДОСЬЄ</span>
          <button
            className="icon-button"
            aria-label="Закрити"
            onClick={() => setPrivacy(false)}
          >
            <Icon name="close" />
          </button>
        </div>
        <h2>Твоя приватність</h2>
        <p>
          Ми не запитуємо ім’я, пошту чи інші особисті дані. Відповіді й прогрес
          тесту зберігаються лише у твоєму браузері. Тема оформлення та вибір
          щодо аналітики також зберігаються локально.
        </p>
        <p>
          Сайт працює на статичному хостингу. Постачальник хостингу може
          обробляти технічні журнали запитів за своєю політикою.
        </p>
        <p>
          Google Tag Manager та налаштовані в ньому аналітичні теги
          завантажуються лише після твоєї згоди. Сайт передає події використання
          без відповідей на запитання. Налаштування можна змінити тут у
          будь-який момент.
        </p>
        {analyticsAvailable() ? (
          <div className="privacy-actions">
            <button
              className="button secondary"
              onClick={() => {
                setConsent(false);
                setConsentOpen(false);
                setToast("Аналітику вимкнено.");
                setPrivacy(false);
              }}
            >
              Відхилити аналітику
            </button>
            <button
              className="button primary"
              onClick={() => {
                setConsent(true);
                setConsentOpen(false);
                setToast("Аналітику дозволено.");
                setPrivacy(false);
              }}
            >
              Дозволити аналітику
            </button>
          </div>
        ) : (
          <p className="privacy-status">
            Аналітику для цього сайту зараз не налаштовано.
          </p>
        )}
        <button
          className="text-button"
          onClick={() => {
            writeStorage("session", null);
            setState({ session: null, result: null, view: "home" });
            history.replaceState(null, "", location.pathname);
            setPrivacy(false);
            setToast("Збережений прогрес видалено.");
          }}
        >
          Видалити збережений прогрес <Icon name="close" size={16} />
        </button>
      </dialog>
    </>
  );
}
