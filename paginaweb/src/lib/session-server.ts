import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'agrilion_session';

/**
 * Token de Firebase que el navegador guardó en una cookie httpOnly.
 * Solo debe importarse desde Server Components, layouts o route handlers.
 */
export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}
