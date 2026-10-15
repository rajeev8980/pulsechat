export type DeviceContactDraft = {
  name: string;
  email?: string;
  phone?: string;
};

type ContactProperty = "name" | "email" | "tel" | "address" | "icon";

type NavigatorContacts = Navigator & {
  contacts?: {
    select: (
      properties: ContactProperty[],
      options?: { multiple?: boolean },
    ) => Promise<
      Array<{
        name?: string[];
        email?: string[];
        tel?: string[];
      }>
    >;
  };
};

export function canPickDeviceContacts(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as NavigatorContacts;
  return Boolean(nav.contacts && typeof nav.contacts.select === "function");
}

/** Android Chrome Contact Picker — returns contacts with name + email/tel. */
export async function pickDeviceContacts(): Promise<DeviceContactDraft[]> {
  const nav = navigator as NavigatorContacts;
  if (!nav.contacts?.select) {
    throw new Error(
      "Contact sync needs Chrome on Android. Use Paste import below on this device.",
    );
  }

  const rows = await nav.contacts.select(["name", "email", "tel"], {
    multiple: true,
  });

  return rows
    .map((row) => {
      const name = (row.name?.[0] || "").trim();
      const email = (row.email || [])
        .map((e) => e.trim())
        .find((e) => e.includes("@"));
      const phone = (row.tel || []).map((t) => t.trim()).find((t) => t.replace(/\D/g, "").length >= 7);
      return {
        name: name || email?.split("@")[0] || phone || "Contact",
        email,
        phone,
      };
    })
    .filter((c) => Boolean(c.email || c.phone));
}

/**
 * Paste lines: `Name, email, phone` or `Name <email>` or `Name +9198…`
 * Empty fields allowed; at least email or phone required.
 */
export function parseContactPaste(text: string): DeviceContactDraft[] {
  const out: DeviceContactDraft[] = [];
  for (const line of text.split(/\r?\n/)) {
    const raw = line.trim();
    if (!raw || raw.startsWith("#")) continue;

    let name = "";
    let email = "";
    let phone = "";

    const angle = raw.match(/^(.+?)\s*<([^>]+@[^>]+)>\s*(.*)$/);
    if (angle) {
      name = angle[1].trim();
      email = angle[2].trim();
      phone = angle[3].trim();
    } else {
      const parts = raw.split(/[,;\t]/).map((p) => p.trim()).filter(Boolean);
      if (parts.length === 1) {
        if (parts[0].includes("@")) email = parts[0];
        else if (/\d{7,}/.test(parts[0])) phone = parts[0];
        else name = parts[0];
      } else {
        name = parts[0] || "";
        for (const p of parts.slice(1)) {
          if (!email && p.includes("@")) email = p;
          else if (!phone && /\d{7,}/.test(p)) phone = p;
          else if (!name) name = p;
        }
      }
    }

    if (!email && !phone) continue;
    if (!name) {
      name = email
        ? email.split("@")[0].replace(/[._]/g, " ")
        : phone;
    }
    out.push({
      name,
      email: email || undefined,
      phone: phone || undefined,
    });
  }
  return out;
}
