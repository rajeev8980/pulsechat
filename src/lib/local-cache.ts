import type { Contact } from "./types";

function key(email: string) {
  return `pulsechat:contacts:${email.trim().toLowerCase()}`;
}

/** Device-side backup so contacts survive server cold starts while logged in. */
export function saveContactsLocal(email: string, contacts: Contact[]) {
  if (typeof window === "undefined" || !email) return;
  try {
    localStorage.setItem(
      key(email),
      JSON.stringify({ savedAt: Date.now(), contacts }),
    );
  } catch {
    // quota / private mode
  }
}

export function loadContactsLocal(email: string): Contact[] | null {
  if (typeof window === "undefined" || !email) return null;
  try {
    const raw = localStorage.getItem(key(email));
    if (!raw) return null;
    const data = JSON.parse(raw) as { contacts?: Contact[] };
    return Array.isArray(data.contacts) ? data.contacts : null;
  } catch {
    return null;
  }
}

export function clearContactsLocal(email: string) {
  if (typeof window === "undefined" || !email) return;
  try {
    localStorage.removeItem(key(email));
  } catch {
    // ignore
  }
}
