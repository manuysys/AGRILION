import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/session-server';

// La cookie sobrevive mientras Firebase pueda renovar el token; el cliente
// actualiza el valor cada 20 minutos y al volver a la pestaña.
const MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const idToken =
    typeof body === 'object' && body !== null && 'idToken' in body
      ? (body as { idToken?: unknown }).idToken
      : null;

  if (typeof idToken !== 'string' || idToken.trim().length < 20) {
    return NextResponse.json({ error: 'ID token inválido' }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SESSION_COOKIE,
    value: idToken.trim(),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
    priority: 'high',
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SESSION_COOKIE,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
