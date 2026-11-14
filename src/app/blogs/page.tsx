import Link from "next/link";
import { articles } from "@/lib/articles";
import { Notebook } from "@/components/notebook";
export const metadata = { title: "Blogs & field notes" };
export default function BlogsPage() { return <div className="section-pad"><div className="section-kicker"><span className="eyebrow">IDEAS WORTH SPENDING TIME WITH</span><Link className="text-link" href="#notebook">Write a field note ↗</Link></div><div className="page-heading"><div><h1>Room for <em>thought.</em></h1><p>Read a perspective. Develop your own.</p></div></div><div className="blog-reading-grid">{articles.slice(0, 6).map(a => <Link className="blog-reading-card" key={a.slug} href={`/learn/${a.slug}`}><span className="eyebrow">{a.tag}</span><h2>{a.title}</h2><p>{a.subtitle}</p><span className="text-link">Read field note · {a.minutes} min ↗</span></Link>)}</div><Notebook /></div>; }
