"use client";

import { useEffect, useState } from "react";

const feedbackStorageKey = "lucro-do-leite-action-feedback";
const fallbackPendingMessage = "Processando solicitação...";
const fallbackDoneMessage = "Ação processada. Confira os dados atualizados.";

type FeedbackState = {
  doneMessage?: string;
  message: string;
  status: "loading" | "success";
};

export function ActionFeedback() {
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  useEffect(() => {
    const storedMessage = window.sessionStorage.getItem(feedbackStorageKey);

    if (storedMessage) {
      window.sessionStorage.removeItem(feedbackStorageKey);
      window.setTimeout(() => {
        setFeedback({ message: storedMessage, status: "success" });
      }, 0);
    }

    function handleSubmit(event: SubmitEvent) {
      const form = event.target instanceof HTMLFormElement ? event.target : null;

      if (!form) {
        return;
      }

      const submitter = event.submitter instanceof HTMLElement ? event.submitter : null;
      const submitterText = submitter?.textContent?.trim();
      const pendingMessage = form.dataset.feedbackPending ?? buildPendingMessage(submitterText);
      const doneMessage = form.dataset.feedbackSuccess ?? fallbackDoneMessage;

      window.sessionStorage.setItem(feedbackStorageKey, doneMessage);
      setFeedback({ doneMessage, message: pendingMessage, status: "loading" });
    }

    document.addEventListener("submit", handleSubmit, true);

    return () => {
      document.removeEventListener("submit", handleSubmit, true);
    };
  }, []);

  useEffect(() => {
    if (!feedback || feedback.status !== "loading") {
      return;
    }

    const timeout = window.setTimeout(() => {
      window.sessionStorage.removeItem(feedbackStorageKey);
      setFeedback({ message: feedback.doneMessage ?? fallbackDoneMessage, status: "success" });
    }, 9000);

    return () => window.clearTimeout(timeout);
  }, [feedback]);

  useEffect(() => {
    if (!feedback || feedback.status !== "success") {
      return;
    }

    const timeout = window.setTimeout(() => setFeedback(null), 4200);

    return () => window.clearTimeout(timeout);
  }, [feedback]);

  if (!feedback) {
    return null;
  }

  return (
    <div className={`action-feedback-toast action-feedback-${feedback.status}`} role="status">
      {feedback.status === "loading" ? <span aria-hidden="true" className="button-spinner" /> : null}
      <span>{feedback.message}</span>
    </div>
  );
}

function buildPendingMessage(submitterText: string | undefined) {
  if (!submitterText) {
    return fallbackPendingMessage;
  }

  const normalized = submitterText.toLowerCase();

  if (normalized.includes("salvar") || normalized.includes("atualizar") || normalized.includes("lançar")) {
    return "Salvando informações...";
  }

  if (normalized.includes("aplicar") || normalized.includes("filtrar")) {
    return "Aplicando filtros...";
  }

  if (normalized.includes("excluir")) {
    return "Excluindo registro...";
  }

  if (normalized.includes("exportar")) {
    return "Gerando relatório...";
  }

  return fallbackPendingMessage;
}
