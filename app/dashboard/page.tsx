import { redirect } from "next/navigation";
import { auth } from "@/auth";
import SignOutButton from "./SignOutButton";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const user = session.user;

  return (
    <main style={{ padding: 16, maxWidth: 720 }}>
      <h1>Dashboard</h1>

      <p>Você está logado.</p>

      <pre
        style={{
          background: "#f6f8fa",
          padding: 12,
          borderRadius: 8,
          overflow: "auto",
        }}
      >
        {JSON.stringify(
          {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            username: user.username,
            role: user.role,
            plan: user.plan,
            planStatus: user.planStatus,
            apiKey: user.apiKey,
          },
          null,
          2
        )}
      </pre>

      <div style={{ marginTop: 12 }}>
        <SignOutButton />
      </div>
    </main>
  );
}
