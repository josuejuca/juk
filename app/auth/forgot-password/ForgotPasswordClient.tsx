"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "../login/styles.module.css";

type ApiResponse = {
  ok: boolean;
  message?: string;
};

export default function ForgotPasswordClient() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.ok) {
        setError(data.message ?? "Não foi possível enviar. Tente novamente.");
        return;
      }

      setSuccess(
        data.message ??
          "Se existir uma conta com esse e-mail, você receberá instruções para redefinir sua senha."
      );
      setEmail("");
    } catch {
      setError("Não foi possível enviar. Verifique sua conexão.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.bg} aria-hidden="true" />

      <section className={styles.card} role="region" aria-label="Recuperar senha">
        <header className={styles.brand}>
          <Image
            className={styles.logo}
            src="/quadraimob.svg"
            alt="Quadra Imob"
            width={240}
            height={34}
            priority
          />
          <h1 className={styles.title}>Recuperar senha</h1>
          <p className={styles.subtle}>Informe seu e-mail para receber instruções.</p>
        </header>

        <form onSubmit={onSubmit} className={styles.form}>
          {error ? (
            <div
              className={`${styles.alert} ${styles.alertError}`}
              role="alert"
              aria-live="polite"
            >
              {error}
            </div>
          ) : null}

          {success ? (
            <div
              className={`${styles.alert} ${styles.alertInfo}`}
              role="status"
              aria-live="polite"
            >
              {success}
            </div>
          ) : null}

          <label className={styles.label}>
            E-mail
            <input
              className={styles.input}
              placeholder="seu@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <button
            className={styles.primaryBtn}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className={styles.spinner} aria-hidden="true" />
                Enviando...
              </>
            ) : (
              "Enviar"
            )}
          </button>
        </form>

        <div className={`${styles.row} ${styles.rowSpaced}`}>
          <span className={styles.subtle}>Lembrou a senha?</span>
          <Link className={styles.link} href="/auth/login">
            Voltar para entrar
          </Link>
        </div>
      </section>
    </main>
  );
}
