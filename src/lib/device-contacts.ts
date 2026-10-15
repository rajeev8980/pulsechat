export type DeviceContactDraft = {
  name: string;
  email?: string;
  /** Extra emails from the same phone contact */
  emails?: string[];
  phone?: string;
  phones?: string[];
};

type ContactProperty = "name" | "email" | "tel" | "address" | "icon";

type NavigatorContacts = Navigator & {
  contacts?: {
    getProperties?: () => Promise<ContactProperty[]>;
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

function normalizeEmail(raw: string): string | null {
  let e = raw.trim().toLowerCase();
  if (e.startsWith("mailto:")) e = e.slice(7);
  // Strip display-name wrappers: "Name" <a@b.com>
  const angle = e.match(/<([^>]+)>/);
  if (angle) e = angle[1].trim();
  if (!e.includes("@") || e.length < 5) return null;
  // Basic sanity
  if (/\s/.test(e)) return null;
  return e;
}

function normalizePhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return null;
  // Keep leading + when present
  return trimmed.startsWith("+") ? `+${digits}` : trimmed;
}

export function canPickDeviceContacts(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as NavigatorContacts;
  return Boolean(nav.contacts && typeof nav.contacts.select === "function");
}

export type PickResult = {
  drafts: DeviceContactDraft[];
  withEmail: number;
  phoneOnly: number;
  selected: number;
};

/**
 * Android Chrome Contact Picker — pulls name + email + tel from selected
 * phonebook entries (user must pick contacts; silent full dump is blocked by the OS).
 */
export async function pickDeviceContacts(): Promise<PickResult> {
  const nav = navigator as NavigatorContacts;
  if (!nav.contacts?.select) {
    throw new Error(
      "Contact sync needs Chrome on Android (HTTPS). Use Paste import on this device.",
    );
  }

  let props: ContactProperty[] = ["name", "email", "tel"];
  try {
    if (nav.contacts.getProperties) {
      const available = await nav.contacts.getProperties();
      props = (["name", "email", "tel"] as ContactProperty[]).filter((p) =>
        available.includes(p),
      );
      if (!props.includes("name")) props.unshift("name");
      // Always ask for email when the device supports it
      if (available.includes("email") && !props.includes("email")) {
        props.push("email");
      }
      if (available.includes("tel") && !props.includes("tel")) {
        props.push("tel");
      }
    }
  } catch {
    // older implementations — use defaults
  }

  if (!props.includes("email") && !props.includes("tel")) {
    throw new Error(
      "This browser cannot share email/phone from contacts. Use Paste import.",
    );
  }

  const rows = await nav.contacts.select(props, { multiple: true });

  const drafts: DeviceContactDraft[] = [];
  for (const row of rows) {
    const name = (row.name || []).map((n) => n.trim()).find(Boolean) || "";

    const emails = [
      ...new Set(
        (row.email || [])
          .map((e) => normalizeEmail(e))
          .filter((e): e is string => Boolean(e)),
      ),
    ];
    const phones = [
      ...new Set(
        (row.tel || [])
          .map((t) => normalizePhone(t))
          .filter((t): t is string => Boolean(t)),
      ),
    ];

    if (emails.length === 0 && phones.length === 0) continue;

    // One draft per contact: primary email + primary phone (Pulse keeps both)
    const email = emails[0];
    const phone = phones[0];
    drafts.push({
      name:
        name ||
        (email
          ? email
              .split("@")[0]
              .replace(/[._]/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase())
          : phone) ||
        "Contact",
      email,
      emails: emails.length > 1 ? emails : undefined,
      phone,
      phones: phones.length > 1 ? phones : undefined,
    });

    // Extra emails on the same person → extra Pulse peers (same phone)
    for (const extra of emails.slice(1)) {
      drafts.push({
        name:
          name ||
          extra
            .split("@")[0]
            .replace(/[._]/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase()),
        email: extra,
        phone,
      });
    }
  }

  return {
    drafts,
    selected: rows.length,
    withEmail: drafts.filter((d) => d.email).length,
    phoneOnly: drafts.filter((d) => !d.email && d.phone).length,
  };
}

/**
 * Paste lines: `Name, email, phone` or `Name <email>` or `Name +9198…`
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
      email = normalizeEmail(angle[2]) || "";
      phone = normalizePhone(angle[3]) || angle[3].trim();
    } else {
      const parts = raw.split(/[,;\t]/).map((p) => p.trim()).filter(Boolean);
      if (parts.length === 1) {
        if (parts[0].includes("@")) email = normalizeEmail(parts[0]) || "";
        else if (/\d{7,}/.test(parts[0]))
          phone = normalizePhone(parts[0]) || parts[0];
        else name = parts[0];
      } else {
        name = parts[0] || "";
        for (const p of parts.slice(1)) {
          if (!email && p.includes("@")) email = normalizeEmail(p) || "";
          else if (!phone && /\d{7,}/.test(p))
            phone = normalizePhone(p) || p;
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
