import { useEffect } from "react";

export type LessonShortcutsConfig = {
  enabled?: boolean;
  isRunning: boolean;
  onToggleRun: () => void;
  onReset: () => void;
  showParticles: boolean;
  onToggleParticles: () => void;
  onOpenHelp?: () => void;
};

/**
 * Per-lesson shortcuts (work well with demos on projector):
 * - Space: start/stop
 * - r: reset
 * - p: toggle electron particles
 * - ?: help
 */
export function useLessonShortcuts({
  enabled = true,
  isRunning,
  onToggleRun,
  onReset,
  showParticles,
  onToggleParticles,
  onOpenHelp,
}: LessonShortcutsConfig) {
  useEffect(() => {
    if (!enabled) return;

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

    const handler = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;

      const k = e.key.toLowerCase();

      if (e.key === " " || k === "spacebar") {
        e.preventDefault();
        onToggleRun();
        return;
      }

      if (k === "r") {
        e.preventDefault();
        if (isRunning) {
          // reset should stop animations too (each lesson controls this)
        }
        onReset();
        return;
      }

      if (k === "p") {
        e.preventDefault();
        if (typeof showParticles === "boolean") {
          onToggleParticles();
        }
        return;
      }

      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault();
        onOpenHelp?.();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled, isRunning, onOpenHelp, onReset, onToggleParticles, onToggleRun, showParticles]);
}

