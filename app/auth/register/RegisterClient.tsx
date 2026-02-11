"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, type SignInResponse } from "next-auth/react";
import Image from "next/image";
import { FiEye, FiEyeOff } from "react-icons/fi";
import styles from "../login/styles.module.css";

type RegisterState = {
  name: string;
  email: string;
  username: string;
  password: string;
  passwordConfirm: string;
};

type AvailabilityState = "idle" | "checking" | "available" | "taken";

type AvailabilityResponse =
  | {
      ok: true;
      emailAvailable?: boolean;
      usernameAvailable?: boolean;
    }
  | {
      ok: false;
      message?: string;
    };

export default function RegisterClient() {
  const router = useRouter();
  const [state, setState] = useState<RegisterState>({
    name: "",
    email: "",
    username: "",
    password: "",
    passwordConfirm: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [emailAvailability, setEmailAvailability] = useState<AvailabilityState>(
    "idle"
  );
  const [usernameAvailability, setUsernameAvailability] =
    useState<AvailabilityState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const emailNormalized = useMemo(
    () => state.email.trim().toLowerCase(),
    [state.email]
  );
  const usernameNormalized = useMemo(
    () => state.username.trim(),
    [state.username]
  );

  const signInClient = signIn as unknown as (
    provider: string,
    options?: Record<string, unknown>
  ) => Promise<SignInResponse | undefined>;

  async function checkAvailability(options: {
    email?: string;
    username?: string;
    signal?: AbortSignal;
  }): Promise<{
    email?: AvailabilityState;
    username?: AvailabilityState;
  }> {
    const params = new URLSearchParams();
    if (options.email) params.set("email", options.email);
    if (options.username) params.set("username", options.username);

    const response = await fetch(
      `/api/register/availability?${params.toString()}`,
      {
        method: "GET",
        signal: options.signal,
      }
    );

    const data = (await response.json()) as AvailabilityResponse;
    if (!response.ok || !data.ok) {
      return {};
    }

    const result: { email?: AvailabilityState; username?: AvailabilityState } =
      {};

    if (options.email) {
      result.email =
        data.emailAvailable === true
          ? "available"
          : data.emailAvailable === false
            ? "taken"
            : "idle";
    }

    if (options.username) {
      result.username =
        data.usernameAvailable === true
          ? "available"
          : data.usernameAvailable === false
            ? "taken"
            : "idle";
    }

    return result;
  }

  useEffect(() => {
    if (!emailNormalized || !emailNormalized.includes("@")) {
      setEmailAvailability("idle");
      return;
    }

    setEmailAvailability("checking");
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const result = await checkAvailability({
          email: emailNormalized,
          signal: controller.signal,
        });
        if (result.email) setEmailAvailability(result.email);
      } catch {
        // keep silent
      }
    }, 450);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [emailNormalized]);

  useEffect(() => {
    if (!usernameNormalized || usernameNormalized.length < 3) {
      setUsernameAvailability("idle");
      return;
    }

    setUsernameAvailability("checking");
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const result = await checkAvailability({
          username: usernameNormalized,
          signal: controller.signal,
        });
        if (result.username) setUsernameAvailability(result.username);
      } catch {
        // keep silent
      }
    }, 450);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [usernameNormalized]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (state.password !== state.passwordConfirm) {
      setError("As senhas não conferem.");
      return;
    }

    if (emailAvailability === "taken") {
      setError("Este e-mail já está cadastrado.");
      return;
    }

    if (usernameAvailability === "taken") {
      setError("Este usuário já está cadastrado.");
      return;
    }

    if (emailAvailability === "checking" || usernameAvailability === "checking") {
      setError("Aguarde a validação de e-mail/usuário.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: state.name,
          email: state.email,
          username: state.username || undefined,
          password: state.password,
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Não foi possível criar a conta.");
        return;
      }

      const result = await signInClient("credentials", {
        identifier: state.email,
        password: state.password,
        redirect: false,
        callbackUrl: "/",
      });

      if (!result || result.error) {
        router.push("/auth/login");
        return;
      }

      router.push(result.url ?? "/");
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.bg} aria-hidden="true" />

      <section className={styles.card} role="region" aria-label="Criar conta">
        <header className={styles.brand}>
          <Image
            className={styles.logo}
            src="/quadraimob.svg"
            alt="Quadra Imob"
            width={240}
            height={34}
            priority
          />
          <h1 className={styles.title}>Criar conta</h1>
          <p className={styles.subtle}>Preencha seus dados para começar</p>
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

          <label className={styles.label}>
            Nome
            <input
              className={styles.input}
              placeholder="Seu nome"
              value={state.name}
              onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
              autoComplete="name"
              required
            />
          </label>

          <label className={styles.label}>
            E-mail
            <input
              className={styles.input}
              placeholder="seu@email.com"
              value={state.email}
              onChange={(e) => setState((s) => ({ ...s, email: e.target.value }))}
              autoComplete="email"
              required
            />
          </label>

          {emailAvailability !== "idle" ? (
            <p
              className={`${styles.hint} ${
                emailAvailability === "taken"
                  ? styles.hintError
                  : emailAvailability === "available"
                    ? styles.hintOk
                    : ""
              }`}
            >
              {emailAvailability === "checking"
                ? "Verificando e-mail..."
                : emailAvailability === "taken"
                  ? "E-mail já cadastrado."
                  : "E-mail disponível."}
            </p>
          ) : null}

          <label className={styles.label}>
            Usuário
            <input
              className={styles.input}
              placeholder="seu_usuario"
              value={state.username}
              onChange={(e) =>
                setState((s) => ({ ...s, username: e.target.value }))
              }
              autoComplete="username"
              required
            />
          </label>

          {usernameAvailability !== "idle" ? (
            <p
              className={`${styles.hint} ${
                usernameAvailability === "taken"
                  ? styles.hintError
                  : usernameAvailability === "available"
                    ? styles.hintOk
                    : ""
              }`}
            >
              {usernameAvailability === "checking"
                ? "Verificando usuário..."
                : usernameAvailability === "taken"
                  ? "Usuário já cadastrado."
                  : "Usuário disponível."}
            </p>
          ) : null}

          <label className={styles.label}>
            Senha
            <div className={styles.passwordWrap}>
              <input
                className={styles.input}
                placeholder="••••••"
                type={showPassword ? "text" : "password"}
                value={state.password}
                onChange={(e) =>
                  setState((s) => ({ ...s, password: e.target.value }))
                }
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

          <label className={styles.label}>
            Confirmar senha
            <div className={styles.passwordWrap}>
              <input
                className={styles.input}
                placeholder="••••••"
                type={showPasswordConfirm ? "text" : "password"}
                value={state.passwordConfirm}
                onChange={(e) =>
                  setState((s) => ({ ...s, passwordConfirm: e.target.value }))
                }
                autoComplete="new-password"
                required
              />
              <button
                className={styles.eyeBtn}
                type="button"
                aria-label={
                  showPasswordConfirm ? "Ocultar senha" : "Mostrar senha"
                }
                title={showPasswordConfirm ? "Ocultar senha" : "Mostrar senha"}
                onClick={() => setShowPasswordConfirm((v) => !v)}
              >
                {showPasswordConfirm ? (
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
            disabled={
              loading ||
              emailAvailability === "checking" ||
              usernameAvailability === "checking" ||
              emailAvailability === "taken" ||
              usernameAvailability === "taken"
            }
          >
            {loading ? (
              <>
                <span className={styles.spinner} aria-hidden="true" />
                Criando...
              </>
            ) : (
              "Criar conta"
            )}
          </button>
        </form>

        <div className={`${styles.row} ${styles.rowSpaced}`}>
          <span className={styles.subtle}>Já tem conta?</span>
          <Link className={styles.link} href="/auth/login">
            Entrar
          </Link>
        </div>
      </section>
    </main>
  );
}
