"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  titleId: string;
  onClose: () => void;
  className?: string;
  children: ReactNode;
}

export function Modal({ titleId, onClose, className, children }: ModalProps) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className={`submit-modal ${className ?? ""}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="关闭">
          <X size={19} />
        </button>
        {children}
      </div>
    </div>
  );
}
