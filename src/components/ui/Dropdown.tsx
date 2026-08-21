"use client";

import { ReactNode, useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface DropdownItem {
  label: string;
  value: string;
  icon?: ReactNode;
  divider?: boolean;
  disabled?: boolean;
}

interface DropdownProps {
  items: DropdownItem[];
  trigger?: ReactNode;
  onSelect: (value: string) => void;
  align?: "left" | "right";
}

export function Dropdown({
  items,
  trigger = "Menu",
  onSelect,
  align = "left",
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-800"
      >
        {trigger}
        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Menu */}
      {isOpen && (
        <div
          className={`
            absolute top-full z-50 mt-2 w-48 rounded-lg
            border border-gray-700 bg-gray-900
            shadow-xl
            animate-in fade-in slide-in-from-top-2 duration-200
            ${align === "right" ? "right-0" : "left-0"}
          `}
        >
          <div className="py-1">
            {items.map((item, idx) => (
              <div key={idx}>
                {item.divider ? (
                  <div className="my-1 border-t border-gray-700" />
                ) : (
                  <button
                    onClick={() => {
                      onSelect(item.value);
                      setIsOpen(false);
                    }}
                    disabled={item.disabled}
                    className={`
                      w-full px-4 py-2 text-left text-sm transition-colors
                      flex items-center gap-2
                      ${
                        item.disabled
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-gray-700 text-gray-300"
                      }
                    `}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
