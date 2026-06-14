"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  pendingLabel?: string;
};

export function SubmitButton({ children, className, disabled = false, pendingLabel = "Processando..." }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-busy={pending}
      className={className}
      disabled={disabled || pending}
      type="submit"
    >
      {pending ? (
        <>
          <span aria-hidden="true" className="button-spinner" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
