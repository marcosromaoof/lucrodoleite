"use client";

type ConfirmSubmitButtonProps = {
  children: React.ReactNode;
  className?: string;
  message: string;
};

export function ConfirmSubmitButton({ children, className, message }: ConfirmSubmitButtonProps) {
  return (
    <button
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
      type="submit"
    >
      {children}
    </button>
  );
}
