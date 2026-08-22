"use client";

import { Check } from "./spark-icons";

export function Toast({ message }: { message: string }) {
  if (!message) {
    return null;
  }
  return (
    <div className="toast" role="status" aria-live="polite" aria-atomic="true">
      <Check size={17} />
      {message}
    </div>
  );
}
