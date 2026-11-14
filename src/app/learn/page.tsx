import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { articles } from "@/lib/articles";
export const metadata = { title: "Learn" };
export default function LearnPage() { return <div className="section-pad learn-page"><div className="section-kicker"><span className="eyebrow">A LITTLE KNOWLEDGE GOES A LONG WAY</span><span className="mono">THE MARKETWISE FIELD NOTES</span></div><div className="page-heading"><div><h1>Make sense of <em>more.</em></h1><p>Clear ideas for a clearer perspective. Start wherever you are.</p></div></div><div className="articles-grid">{articles.map((a, i) => <Link className="article-card" href={`/learn/${a.slug}`} key={a.slug}><div className={`article-art art-${i}`} aria-hidden="true"><span>{["↗", "✳", "+"][i]}</span><div /></div><span className="eyebrow">{a.tag} · {a.minutes} MIN READ</span><h2>{a.title}</h2><p>{a.subtitle}</p><span className="feature-link">Read the field note <ArrowUpRight size={18} /></span></Link>)}</div></div>; }
