"use client";

// Shared UI atoms used only inside CourseForm

export function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <p className="font-mono text-[13px] uppercase tracking-[0.2em] text-gray-600 mb-2">
      {children}
      {required && <span className="text-red-400/80 ml-1">*</span>}
    </p>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center border transition-colors ${
        checked ? "bg-purple border-purple/60" : "bg-gray-800 border-gray-700"
      }`}
    >
      <span
        className={`inline-block h-3 w-3 bg-white transition-transform ${
          checked ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  );
}
