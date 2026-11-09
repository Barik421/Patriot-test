import { useEffect, useRef } from "react";
import type { MouseEvent } from "react";

export function FaqItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const details = useRef<HTMLDetailsElement>(null);
  const animation = useRef<Animation | null>(null);
  const targetOpen = useRef(false);

  useEffect(() => () => animation.current?.cancel(), []);

  function toggle(event: MouseEvent<HTMLElement>) {
    const element = details.current;
    if (!element) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !element.animate
    )
      return;
    event.preventDefault();

    const startHeight = element.getBoundingClientRect().height;
    const opening = animation.current ? !targetOpen.current : !element.open;
    targetOpen.current = opening;
    animation.current?.cancel();
    element.open = true;
    element.dataset.expanded = String(opening);

    const style = getComputedStyle(element);
    const summary = element.querySelector("summary")!;
    const closedHeight =
      summary.getBoundingClientRect().height +
      parseFloat(style.paddingTop) +
      parseFloat(style.paddingBottom) +
      parseFloat(style.borderTopWidth) +
      parseFloat(style.borderBottomWidth);
    const endHeight = opening
      ? element.getBoundingClientRect().height
      : closedHeight;
    element.style.overflow = "hidden";

    const transition = element.animate(
      [{ height: `${startHeight}px` }, { height: `${endHeight}px` }],
      { duration: 280, easing: "cubic-bezier(.22, 1, .36, 1)" },
    );
    animation.current = transition;
    transition.onfinish = () => {
      element.open = opening;
      element.style.overflow = "";
      delete element.dataset.expanded;
      animation.current = null;
    };
  }

  return (
    <details ref={details}>
      <summary onClick={toggle}>
        {question}
        <span aria-hidden="true">+</span>
      </summary>
      <p>{answer}</p>
    </details>
  );
}
