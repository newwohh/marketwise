import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { articles } from "@/lib/articles";
import { ReadAloud } from "@/components/read-aloud";
export function generateStaticParams() { return articles.map(a => ({ slug: a.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return { title: articles.find(a => a.slug === slug)?.title ?? "Field notes" }; }
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const article = articles.find(a => a.slug === slug); if (!article) notFound(); return <article className="article-page section-pad"><Link href="/learn" className="text-link"><ArrowLeft size={16} /> All field notes</Link><span className="eyebrow">{article.tag} · {article.minutes} MIN READ</span><h1>{article.title}</h1><p className="article-subtitle">{article.subtitle}</p><ReadAloud text={[article.title, article.subtitle, ...article.sections.flat()].join(". ")} />{article.sections.map(([title, text]) => <section key={title}><h2>{title}</h2><p>{text}</p></section>)}<Link href="/simulator" className="button">Explore a scenario <ArrowUpRight size={17} /></Link></article>; }
