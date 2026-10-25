import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
export default function Sheet({ children, onClose, titleId, label, className = "" }) {
  const ref = useRef();
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement,
      overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.querySelector("button,input,textarea,select")?.focus();
    return () => {
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return (
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) close.current();
      }}
    >
      <section
        ref={ref}
        className={`modal ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-label={label}
        onKeyDown={(e) => {
          if (e.key === "Escape") close.current();
          if (e.key === "Tab") {
            const controls = [
              ...ref.current.querySelectorAll("button,input,textarea,select,a[href],summary"),
            ].filter((el) => !el.disabled && el.offsetParent !== null);
            if (!controls.length) {
              e.preventDefault();
              return;
            }
            if (e.shiftKey && document.activeElement === controls[0]) {
              e.preventDefault();
              controls.at(-1).focus();
            } else if (!e.shiftKey && document.activeElement === controls.at(-1)) {
              e.preventDefault();
              controls[0].focus();
            }
          }
        }}
      >
        <button
          className="close icon-button"
          aria-label="Close dialog"
          onClick={() => close.current()}
        >
          <X size={20} />
        </button>
        {children}
      </section>
    </div>
  );
}
