"use client";
// Preserve the old home-page support launcher, with an accessible modal and the
// same honest guided responses used on /chat. No third-party model is implied.
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X } from "lucide-react";
import { HelpAssistant } from "./help-assistant";
export function FloatingHelp() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (open) dialog.current?.showModal(); else dialog.current?.close(); }, [open]);
  useEffect(() => setOpen(false), [path]);
  if (path === "/chat") return null;
  return <><button className="floating-help-launcher" aria-label="Open Marketwise help" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}><MessageCircle size={21} /><span>Need a little help?</span></button><dialog ref={dialog} className="floating-help-dialog" aria-labelledby="floating-help-title" onCancel={() => setOpen(false)} onClick={event => { if (event.target === event.currentTarget) setOpen(false); }}><div className="panel-title"><h2 id="floating-help-title">A little guidance.</h2><button className="icon-button" aria-label="Close help" onClick={() => setOpen(false)}><X size={18} /></button></div>{open && <HelpAssistant />}</dialog></>;
}
