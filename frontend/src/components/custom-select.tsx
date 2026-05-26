"use client";

import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

type CustomSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type CustomSelectProps = {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  options: CustomSelectOption[];
  required?: boolean;
  disabled?: boolean;
  name?: string;
  placeholder?: string;
};

export function CustomSelect({
  disabled = false,
  id,
  name,
  onValueChange,
  options,
  placeholder,
  required = false,
  value,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listboxId = useId();

  const selectedOption = useMemo(() => options.find((option) => option.value === value) ?? null, [options, value]);
  const displayLabel = selectedOption?.label ?? placeholder ?? options[0]?.label ?? "Selecione";

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  function handleTriggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (disabled) {
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen(true);
    }
  }

  function handleOptionSelect(nextValue: string) {
    onValueChange(nextValue);
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div ref={containerRef} className={`custom-select${isOpen ? " is-open" : ""}${disabled ? " is-disabled" : ""}`}>
      <select
        aria-hidden="true"
        className="custom-select-native"
        data-custom-select-trigger-id={id}
        disabled={disabled}
        name={name}
        required={required}
        tabIndex={-1}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>

      <button
        id={id}
        ref={triggerRef}
        type="button"
        className="custom-select-trigger"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className={`custom-select-label${selectedOption ? "" : " is-placeholder"}`}>{displayLabel}</span>
        <span className="custom-select-chevron" aria-hidden="true" />
      </button>

      {isOpen ? (
        <div className="custom-select-popover">
          <ul id={listboxId} className="custom-select-listbox" role="listbox" aria-labelledby={id}>
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <li key={option.value} role="presentation">
                  <button
                    type="button"
                    role="option"
                    className={`custom-select-option${isSelected ? " is-selected" : ""}`}
                    aria-selected={isSelected}
                    disabled={option.disabled}
                    onClick={() => handleOptionSelect(option.value)}
                  >
                    {option.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
