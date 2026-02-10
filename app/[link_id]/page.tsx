import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getJukLinkById, JukApiError } from "@/lib/juk";

type DeviceType = "Android" | "iOS" | "macOS" | "Desktop";

function detectDeviceTypeFromUserAgent(userAgent: string | null): DeviceType {
  if (!userAgent) return "Desktop";

  // Android
  if (/Android/i.test(userAgent)) return "Android";

  // iOS (inclui iPadOS que às vezes se identifica como Macintosh + Mobile)
  if (/(iPhone|iPad|iPod)/i.test(userAgent)) return "iOS";
  if (/Macintosh/i.test(userAgent) && /Mobile/i.test(userAgent)) return "iOS";

  // macOS
  if (/Mac OS X/i.test(userAgent) || /Macintosh/i.test(userAgent)) return "macOS";

  return "Desktop";
}

function getErrorStatus(error: unknown): number | undefined {
  if (error instanceof JukApiError) return error.status;
  if (typeof error !== "object" || error === null) return undefined;
  if (!("status" in error)) return undefined;

  const status = (error as { status?: unknown }).status;
  return typeof status === "number" ? status : undefined;
}

export default async function LinkPage({
  params,
}: {
  params: Promise<{ link_id: string }>;
}) {
  const { link_id } = await params;

  const userAgent = (await headers()).get("user-agent");
  const deviceType = detectDeviceTypeFromUserAgent(userAgent);

  const data = await getJukLinkById(link_id).catch((error: unknown) => {
    const status = getErrorStatus(error);
    if (status === 404 || status === 400) notFound();
    throw error;
  });

  return (
    <section style={{ padding: 16 }}>
      <h1>Link: {link_id}</h1>
      <p>Tipo de dispositivo: {deviceType}</p>
      <p>Resposta da API:</p>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </section>
  );
}
