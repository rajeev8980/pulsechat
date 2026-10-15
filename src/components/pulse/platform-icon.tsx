import {
  FaBolt,
  FaFacebookMessenger,
  FaInstagram,
  FaTelegram,
  FaWhatsapp,
} from "react-icons/fa6";
import { MdSms } from "react-icons/md";
import type { Platform } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PlatformIcon({
  platform,
  className,
}: {
  platform: Platform;
  className?: string;
}) {
  const cls = cn("shrink-0", className);
  switch (platform) {
    case "whatsapp":
      return <FaWhatsapp className={cls} />;
    case "telegram":
      return <FaTelegram className={cls} />;
    case "instagram":
      return <FaInstagram className={cls} />;
    case "messenger":
      return <FaFacebookMessenger className={cls} />;
    case "sms":
      return <MdSms className={cls} />;
    default:
      return <FaBolt className={cls} />;
  }
}

export function PlatformBadge({
  platform,
  size = "sm",
  className,
}: {
  platform: Platform;
  size?: "sm" | "md";
  className?: string;
}) {
  const dim = size === "md" ? "w-5 h-5 text-[10px]" : "w-4 h-4 text-[8px]";
  const grad =
    platform === "whatsapp"
      ? "wa-grad"
      : platform === "telegram"
        ? "tg-grad"
        : platform === "instagram"
          ? "ig-grad"
          : platform === "messenger"
            ? "fb-grad"
            : platform === "sms"
              ? "sms-grad"
              : "pulse-grad";

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center text-white shadow-md",
        dim,
        grad,
        className,
      )}
    >
      <PlatformIcon platform={platform} className="size-[0.65em]" />
    </div>
  );
}
