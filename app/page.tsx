import { redirect  } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";


export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (<><h1>Pagina Inicial</h1>
      <Link href="/auth/login">Entrar</Link>
      <br />
      <Link href="/auth/register">Criar conta</Link>  
  </>
  
);
}
