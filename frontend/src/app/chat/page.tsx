import { HelpAssistant } from "@/components/help-assistant";
export const metadata = { title: "Help assistant" };
export default function ChatPage() { return <div className="section-pad help-page"><div className="section-kicker"><span className="eyebrow">A LITTLE HELP, RIGHT HERE</span><span className="mono">THE MARKETWISE GUIDE</span></div><div className="page-heading"><div><h1>Find your <em>way.</em></h1><p>Questions about the workspace? Let’s point you in the right direction.</p></div></div><HelpAssistant /></div>; }
