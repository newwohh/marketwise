"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Send } from "lucide-react";
import { helpAnswer, helpTopics } from "@/lib/help";
export function HelpAssistant() {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string; href?: string }[]>([{ role: "assistant", text: "A little guidance goes a long way. What would you like to find in Marketwise?" }]);
  const [input, setInput] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => { bottom.current?.scrollIntoView({ block: "nearest", behavior: "instant" }); }, [messages]);
  function send(text: string) { const question = text.trim().slice(0, 500); if (!question) return; const answer = helpAnswer(question); setMessages(current => [...current.slice(-38), { role: "user", text: question }, { role: "assistant", text: answer.answer, href: answer.href }]); setInput(""); }
  return <div className="help-panel"><div className="help-messages" role="log" aria-label="Support conversation" aria-live="polite">{messages.map((message, i) => <div className={`help-message ${message.role}`} key={i}><span className="mono">{message.role === "user" ? "YOU" : "MARKETWISE HELP"}</span><p>{message.text}</p>{message.href && <Link className="text-link" href={message.href}>Open this feature <ArrowUpRight size={14} /></Link>}</div>)}<div ref={bottom} /></div><div className="suggested-questions">{helpTopics.slice(0, 4).map(t => <button key={t.question} onClick={() => send(t.question)}>{t.question}</button>)}</div><form className="help-input" onSubmit={e => { e.preventDefault(); send(input); }}><label className="sr-only" htmlFor="help-message">Your question</label><input id="help-message" maxLength={500} placeholder="Ask about a Marketwise feature…" value={input} onChange={e => setInput(e.target.value)} /><button className="icon-button" type="submit" aria-label="Send question" disabled={!input.trim()}><Send size={17} /></button></form><p className="provider-caption">Guided answers about Marketwise. No AI model, financial predictions, or account access.</p></div>;
}
