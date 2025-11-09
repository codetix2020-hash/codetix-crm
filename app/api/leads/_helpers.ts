import { NextResponse } from "next/server";

export function checkAuth(request: Request) {
  const auth = request.headers.get("authorization");

  if (!auth) {
    return NextResponse.json(
      { success: false, error: "Falta header Authorization" },
      { status: 401 }
    );
  }

  const [type, token] = auth.split(" ");

  if (type !== "Bearer" || !token) {
    return NextResponse.json(
      { success: false, error: "Formato de token inválido" },
      { status: 401 }
    );
  }

  if (token !== process.env.LEADS_API_KEY) {
    return NextResponse.json(
      { success: false, error: "Token incorrecto" },
      { status: 401 }
    );
  }

  return null; // Autorizado
}
