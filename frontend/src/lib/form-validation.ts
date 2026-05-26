type NoticeFn = (message: string, options?: { tone?: "error" | "success" }) => void;

const INVALID_FIELD_SELECTOR = "input:invalid, select:invalid, textarea:invalid";
const INVALID_GROUP_CLASS = "input-group-invalid";
const INVALID_FIELD_CLASS = "field-invalid-pulse";
const INVALID_TIMEOUT_MS = 3000;
const INVALID_TIMER_KEY = "invalidFeedbackTimer";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function clearInvalidState(field: HTMLElement) {
  field.classList.remove(INVALID_FIELD_CLASS);
  field.removeAttribute("aria-invalid");
  field.closest(".input-group")?.classList.remove(INVALID_GROUP_CLASS);
}

function scheduleInvalidFeedback(field: HTMLElement) {
  const pendingTimer = Number(field.dataset[INVALID_TIMER_KEY] ?? "0");
  if (pendingTimer) {
    window.clearTimeout(pendingTimer);
  }

  clearInvalidState(field);
  void field.offsetWidth;

  field.classList.add(INVALID_FIELD_CLASS);
  field.setAttribute("aria-invalid", "true");
  field.closest(".input-group")?.classList.add(INVALID_GROUP_CLASS);

  const timer = window.setTimeout(() => {
    clearInvalidState(field);
    delete field.dataset[INVALID_TIMER_KEY];
  }, INVALID_TIMEOUT_MS);

  field.dataset[INVALID_TIMER_KEY] = String(timer);
}

export function validateFormWithFeedback(form: HTMLFormElement, showNotice?: NoticeFn) {
  if (form.checkValidity()) {
    return true;
  }

  showNotice?.("Preencha os campos obrigatorios.", { tone: "error" });

  const invalidFields = Array.from(form.querySelectorAll<HTMLElement>(INVALID_FIELD_SELECTOR));
  invalidFields.forEach(scheduleInvalidFeedback);

  const firstInvalidField = invalidFields[0];
  if (!firstInvalidField) {
    return false;
  }

  const reduceMotion = prefersReducedMotion();
  firstInvalidField.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block: "center",
    inline: "nearest",
  });

  window.setTimeout(() => {
    firstInvalidField.focus({ preventScroll: true });
  }, reduceMotion ? 0 : 180);

  return false;
}
