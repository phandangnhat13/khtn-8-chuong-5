import { useEffect } from "react";

type Handler = (e: KeyboardEvent) => void;

export type AppHotkeysConfig = {
  enabled?: boolean;
  onToggleHelp?: () => void;
  onGoHome?: () => void;
  onGoQuiz?: () => void;
  onGoLesson?: (lessonPath: "/lesson/20" | "/lesson/21-22" | "/lesson/23" | "/lesson/24-25") => void;
};

/**
 * Global hotkeys designed for teaching in class:
 * - '?' opens Help
 * - g h / g q / g 2 / g 3 / g 4 / g 5 for quick navigation
 *
 * Avoids overriding inputs/contenteditable.
 */
export function useAppHotkeys({
  enabled = true,
  onToggleHelp,
  onGoHome,
  onGoQuiz,
  onGoLesson,
}: AppHotkeysConfig) {
  useEffect(() => {
    if (!enabled) return;

    let chord: "g" | null = null;
    let chordTimer: number | null = null;

    const resetChord = () => {
      chord = null;
      if (chordTimer) {
        window.clearTimeout(chordTimer);
        chordTimer = null;
      }
    };

    const isTypingTarget = (t: EventTarget | null) => {
      if (!(t instanceof HTMLElement)) return false;
      const tag = t.tagName.toLowerCase();
      return (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        t.isContentEditable
      );
    };

    const handler: Handler = (e) => {
      if (e.defaultPrevented) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;

      // Toggle help
      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault();
        onToggleHelp?.();
        return;
      }

      // Chords: g then ...
      if (e.key.toLowerCase() === "g") {
        chord = "g";
        if (chordTimer) window.clearTimeout(chordTimer);
        chordTimer = window.setTimeout(resetChord, 900);
        return;
      }

      if (chord === "g") {
        const k = e.key.toLowerCase();
        resetChord();

        if (k === "h") {
          e.preventDefault();
          onGoHome?.();
          return;
        }
        if (k === "q") {
          e.preventDefault();
          onGoQuiz?.();
          return;
        }
        if (k === "2") {
          e.preventDefault();
          onGoLesson?.("/lesson/20");
          return;
        }
        if (k === "3") {
          e.preventDefault();
          onGoLesson?.("/lesson/21-22");
          return;
        }
        if (k === "4") {
          e.preventDefault();
          onGoLesson?.("/lesson/23");
          return;
        }
        if (k === "5") {
          e.preventDefault();
          onGoLesson?.("/lesson/24-25");
          return;
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => {
      resetChord();
      window.removeEventListener("keydown", handler);
    };
  }, [enabled, onGoHome, onGoLesson, onGoQuiz, onToggleHelp]);
}

