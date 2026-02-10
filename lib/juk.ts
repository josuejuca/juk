import { http } from "./http";

export type JukDestinos = {
  encurtado: string;
  padrao: string;
  android: string | null;
  ios: string | null;
};

export type JukLinkResponse = {
  destinos: JukDestinos;
};

export type JukNotFoundResponse = {
  detail: string;
};

export class JukApiError extends Error {
  readonly status: number;
  readonly detail?: string;

  constructor(status: number, message: string, detail?: string) {
    super(message);
    this.name = "JukApiError";
    this.status = status;
    this.detail = detail;
  }
}

const API_BASE_URL = process.env.JUK_API_BASE_URL ?? "https://api.juk.re";

const RESERVED_LINK_IDS = new Set(
  [
    // Reservados na API/infra
    "docs",
    "doc",
    "openapi.json",
    "swagger",
    "redoc",
    // Reservados comuns na web
    "robots.txt",
    "favicon.ico",
    "sitemap.xml",
    // Reservados do Next/rotas internas (evita colisões)
    "api",
    "_next",
    "blog",
  ].map((value) => value.toLowerCase())
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isJukLinkResponse(value: unknown): value is JukLinkResponse {
  if (!isRecord(value)) return false;
  if (!isRecord(value.destinos)) return false;

  const destinos = value.destinos;
  return (
    typeof destinos.encurtado === "string" &&
    typeof destinos.padrao === "string" &&
    isNullableString(destinos.android) &&
    isNullableString(destinos.ios)
  );
}

function getDetailMessage(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined;
  return typeof value.detail === "string" ? value.detail : undefined;
}

function assertValidLinkId(linkId: string): void {
  // Ex: "jucasoft-app" (alfa-numérico com hífen)
  if (!/^[A-Za-z0-9-]+$/.test(linkId)) {
    throw new JukApiError(400, "ID de link inválido.");
  }

  if (RESERVED_LINK_IDS.has(linkId.toLowerCase())) {
    throw new JukApiError(400, "ID de link reservado.");
  }
}

export async function getJukLinkById(linkId: string): Promise<JukLinkResponse> {
  assertValidLinkId(linkId);

  const url = `${API_BASE_URL.replace(/\/$/, "")}/${encodeURIComponent(linkId)}`;

  const response = await http.get<unknown>(url, {
    validateStatus: () => true,
  });

  if (response.status === 404) {
    const detail = getDetailMessage(response.data);
    throw new JukApiError(404, detail ?? "Link não encontrado.", detail);
  }

  if (response.status < 200 || response.status >= 300) {
    throw new JukApiError(response.status, "Falha ao consultar a API.");
  }

  if (!isJukLinkResponse(response.data)) {
    throw new JukApiError(502, "Resposta inválida da API.");
  }

  return response.data;
}
