"use client";

import { FormEvent, useState } from "react";
import { signIn, type SignInResponse } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import styles from "./styles.module.css";
import { FaFacebookF, FaGithub, FaGoogle } from "react-icons/fa";
import { FiEye, FiEyeOff } from "react-icons/fi";

export default function LoginClient() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInClient = signIn as unknown as (
    provider: string,
    options?: Record<string, unknown>
  ) => Promise<SignInResponse | undefined>;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await signInClient("credentials", {
      identifier,
      password,
      redirect: false,
      callbackUrl: "/",
    });

    if (!result) {
      setError("Não foi possível entrar. Tente novamente.");
      setIsSubmitting(false);
      return;
    }

    if (result.error) {
      setError("Credenciais inválidas.");
      setIsSubmitting(false);
      return;
    }

    router.push(result.url ?? "/");
  }

  return (
    <main className={styles.page}>
      <div className={styles.bg} aria-hidden="true" />

      <section className={styles.card} role="region" aria-label="Entrar">
        <header className={styles.brand}>
          <Image
            className={styles.logo}
            src="/quadraimob.svg"
            alt="Quadra Imob"
            width={240}
            height={34}
            priority
          />
        </header>

        <div className={styles.social}>
          <button
            className={styles.socialBtn}
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/" })}
          >
            <FaGoogle
              className={`${styles.socialIcon} ${styles.google}`}
              aria-hidden="true"
            />
            Entrar com Google
          </button>
          <button
            className={styles.socialBtn}
            type="button"
            onClick={() => signIn("facebook", { callbackUrl: "/" })}
          >
            <FaFacebookF
              className={`${styles.socialIcon} ${styles.facebook}`}
              aria-hidden="true"
            />
            Entrar com Facebook
          </button>
          <button
            className={styles.socialBtn}
            type="button"
            onClick={() => signIn("github", { callbackUrl: "/" })}
          >
            <FaGithub
              className={`${styles.socialIcon} ${styles.github}`}
              aria-hidden="true"
            />
            Entrar com GitHub
          </button>
        </div>

        <div className={styles.divider}>
          <span />
          <p>OU</p>
          <span />
        </div>

        <form onSubmit={onSubmit} className={styles.form}>
          <div className={styles.formHeader}>
            <h1 className={styles.title}>Entrar</h1>
            <Link className={styles.link} href="/auth/register">
              Criar uma conta
            </Link>
          </div>

          {error ? (
            <div
              className={`${styles.alert} ${styles.alertError}`}
              role="alert"
              aria-live="polite"
            >
              {error}
            </div>
          ) : null}

          <label className={styles.label}>
            E-mail
            <input
              className={styles.input}
              placeholder="seu@email.com"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              autoComplete="username"
              required
            />
          </label>

          <label className={styles.label}>
            Senha
            <div className={styles.passwordWrap}>
              <input
                className={styles.input}
                placeholder="••••••"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
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
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </button>
        </form>

        <div className={`${styles.row} ${styles.rowSpaced}`}>
          <span className={styles.subtle}>Esqueceu a senha?</span>
          <Link className={styles.link} href="/auth/forgot-password">
            Recupere sua senha
          </Link>
        </div>
      </section>
    </main>
  );
}
