import { loginAction } from "./actions";
import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; from?: string }>;
}) {
  if (await isAuthenticated()) redirect("/admin");
  const { error, from } = await searchParams;

  return (
    <div className="login-wrap">
      <form action={loginAction} className="login-card">
        <div className="brand">
          <span className="dot" />
          Panel de administración
        </div>
        {error && <div className="flash flash-err">Contraseña incorrecta.</div>}
        <input type="hidden" name="from" value={from ?? "/admin"} />
        <div className="field">
          <label htmlFor="password">Contraseña</label>
          <input id="password" name="password" type="password" autoFocus required />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
          Entrar
        </button>
      </form>
    </div>
  );
}
