"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type NoticeTone = "success" | "error";

export type TimedNotice = {
  id: number;
  message: string;
  visible: boolean;
  tone: NoticeTone;
  title?: string;
};

type UseTimedNoticeOptions = {
  durationMs?: number;
  exitMs?: number;
};

type ShowNoticeOptions = {
  tone?: NoticeTone;
  title?: string;
};

const DEFAULT_DURATION_MS = 3000;
const DEFAULT_EXIT_MS = 220;

export function useTimedNotice(options: UseTimedNoticeOptions = {}) {
  const durationMs = options.durationMs ?? DEFAULT_DURATION_MS;
  const exitMs = options.exitMs ?? DEFAULT_EXIT_MS;
  const [notice, setNotice] = useState<TimedNotice | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }
  }, []);

  const showNotice = useCallback(
    (message: string, options: ShowNoticeOptions = {}) => {
      clearTimers();
      const id = Date.now();
      const tone = options.tone ?? "success";

      setNotice({ id, message, visible: true, tone, title: options.title });

      hideTimerRef.current = setTimeout(() => {
        setNotice((current) => (current && current.id === id ? { ...current, visible: false } : current));
      }, durationMs);

      clearTimerRef.current = setTimeout(() => {
        setNotice((current) => (current && current.id === id ? null : current));
      }, durationMs + exitMs);
    },
    [clearTimers, durationMs, exitMs],
  );

  useEffect(() => clearTimers, [clearTimers]);

  return { notice, showNotice, clearNotice: clearTimers };
}

type ValidationToastProps = {
  notice: TimedNotice | null;
};

export function ValidationToast({ notice }: ValidationToastProps) {
  if (!notice) {
    return null;
  }

  const title = notice.title ?? (notice.tone === "error" ? "Campos obrigatorios" : "Sucesso");
  const role = notice.tone === "error" ? "alert" : "status";
  const ariaLive = notice.tone === "error" ? "assertive" : "polite";

  return (
    <div
      className="form-toast"
      data-tone={notice.tone}
      data-state={notice.visible ? "visible" : "hidden"}
      role={role}
      aria-live={ariaLive}
      aria-atomic="true"
    >
      <div className="form-toast-icon" aria-hidden="true">
        <svg className="form-toast-clock" viewBox="0 0 48 48" fill="none">
          <circle className="form-toast-clock-track" cx="24" cy="24" r="18" />
          <circle className="form-toast-clock-progress" cx="24" cy="24" r="18" />
          <path className="form-toast-clock-hand form-toast-clock-hand-hour" d="M24 24V16" />
          <path className="form-toast-clock-hand form-toast-clock-hand-minute" d="M24 24L31 27" />
          <circle className="form-toast-clock-center" cx="24" cy="24" r="2.25" />
        </svg>
      </div>
      <div className="form-toast-copy">
        <div className="form-toast-title">{title}</div>
        <div className="form-toast-message">{notice.message}</div>
      </div>
    </div>
  );
}
