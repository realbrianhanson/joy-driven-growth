import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";

/** Copies text, with a fallback for browsers that block the async clipboard API. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand("copy");
      el.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

interface CopyButtonProps extends Omit<ButtonProps, "onClick" | "children"> {
  text: string;
  label?: string;
  copiedLabel?: string;
  /** Toast shown after a successful copy. Pass null for none. */
  toastMessage?: string | null;
  iconOnly?: boolean;
}

export function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied",
  toastMessage = null,
  iconOnly,
  variant = "outline",
  size = "sm",
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timer.current), []);

  const handleCopy = async () => {
    const ok = await copyText(text);
    if (!ok) {
      toast.error("Could not copy. Select the text and copy it by hand.");
      return;
    }
    setCopied(true);
    if (toastMessage) toast.success(toastMessage);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1800);
  };

  const Icon = copied ? Check : Copy;
  return (
    <Button
      type="button"
      variant={variant}
      size={iconOnly ? "icon" : size}
      onClick={handleCopy}
      aria-label={iconOnly ? (copied ? copiedLabel : label) : undefined}
      {...props}
    >
      <Icon className={iconOnly ? "h-4 w-4" : "mr-1.5 h-3.5 w-3.5"} />
      {!iconOnly && (copied ? copiedLabel : label)}
    </Button>
  );
}
