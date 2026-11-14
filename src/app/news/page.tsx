import { NewsList } from "@/components/news-list";
export const metadata = { title: "Market news" };
export const revalidate = 900;
export default function NewsPage() { return <div className="section-pad"><div className="section-kicker"><span className="eyebrow">THE WIDER CONTEXT</span><span className="mono">FROM THE ORIGINAL SOURCES</span></div><div className="page-heading"><div><h1>Beyond the <em>numbers.</em></h1><p>Crypto and financial headlines. Read the original story, form your own view.</p></div></div><NewsList /></div>; }
