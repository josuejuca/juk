"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FiEye, FiEyeOff } from "react-icons/fi";

import styles from "../../auth/login/styles.module.css";

type ApiResponse = {
  ok: boolean;
  message?: string;
};

export default function NovaSenhaPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const token = params?.token;

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token) {
      setError("Link inválido.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/auth-password/${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        }
      );

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.ok) {
        setError(data.message ?? "Não foi possível atualizar sua senha.");
        return;
      }

      setSuccess(data.message ?? "Senha atualizada com sucesso.");
      setPassword("");

      setTimeout(() => {
        router.push("/auth/login");
      }, 900);
    } catch {
      setError("Não foi possível atualizar. Verifique sua conexão.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.bg} aria-hidden="true" />

      <section className={styles.card} role="region" aria-label="Trocar senha">
        <header className={styles.brand}>
          <Image
            className={styles.logo}
            src="/quadraimob.svg"
            alt="Quadra Imob"
            width={240}
            height={34}
            priority
          />
          <h1 className={styles.title}>Definir nova senha</h1>
          <p className={styles.subtle}>Digite sua nova senha abaixo.</p>
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
            Nova senha
            <div className={styles.passwordWrap}>
              <input
                className={styles.input}
                placeholder="••••••"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                className={styles.eyeBtn}
                type="button"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? (
                  <FiEyeOff aria-hidden="true" />
                ) : (
                  <FiEye aria-hidden="true" />
                )}
              </button>
            </div>
          </label>

          <button
            className={styles.primaryBtn}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className={styles.spinner} aria-hidden="true" />
                Salvando...
              </>
            ) : (
              "Salvar senha"
            )}
          </button>
        </form>

        <div className={`${styles.row} ${styles.rowSpaced}`}>
          <span className={styles.subtle}>Voltar</span>
          <Link className={styles.link} href="/auth/login">
            Entrar
          </Link>
        </div>
      </section>
    </main>
  );
}
