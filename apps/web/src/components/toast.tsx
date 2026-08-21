"use client";

import { Check } from "./spark-icons";

export function Toast({ message }: { message: string }) {
  if (!message) {
    return null;
  }
  return (
    <div className="toast">
      <Check size={17} />
      {message}
    </div>
  );
}
