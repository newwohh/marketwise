import Link from "next/link";
export const metadata = { title: "Grow your understanding" };
const pillars = [
  ["01", "Start with the context.", "Understand what a price represents, where it came from, and how fresh it is before making comparisons.", "/learn/reading-market-data", "Read the market"],
  ["02", "Build a longer view.", "Model your assumptions with contributions and time. Explore several outcomes, including losses, instead of anchoring to a single forecast.", "/simulator", "Model a possibility"],
  ["03", "Look at the whole picture.", "Consider concentration, correlation, and the risks that different holdings share. Diversification helps manage risk, but does not eliminate it.", "/learn/diversification", "Understand diversification"],
  ["04", "Keep learning deliberately.", "Write down questions, test your understanding, and separate evidence from a story you want to believe.", "/blogs#notebook", "Open your notebook"],
];
export default function GrowPage() { return <div className="section-pad"><div className="section-kicker"><span className="eyebrow">A LONGER VIEW STARTS HERE</span></div><div className="page-heading"><div><h1>Grow your <em>understanding.</em></h1><p>Better questions. More considered decisions. No promises of returns.</p></div></div><div className="growth-pillars">{pillars.map(([n, title, text, href, label]) => <section key={n}><span className="mono">{n}</span><div><h2>{title}</h2><p>{text}</p><Link className="text-link" href={href}>{label} ↗</Link></div><span className="growth-mark" aria-hidden="true">✳</span></section>)}</div></div>; }
