import Link from "next/link";
import { getNews } from "@/lib/news";
export async function NewsList({ category }: { category?: string }) {
  const { items, unavailable } = await getNews(category);
  return <><div className="news-list">{items.map(item => <a className="news-item" key={item.url} href={item.url} target="_blank" rel="noopener noreferrer"><span className="mono">{item.source}{item.published ? ` · ${new Date(item.published).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "Asia/Kolkata" })}` : ""}</span><h3>{item.title}</h3><span aria-hidden="true">↗</span></a>)}</div>{unavailable.length > 0 && <p className="provider-caption" role="status">{unavailable.join(" and ")} headlines are unavailable at the moment. No sample headlines are substituted.</p>}<p className="provider-caption">Headlines belong to their publishers and link to the original reporting. Feeds refresh periodically. <Link href="/learn/reading-market-data">Read market information with context ↗</Link></p></>;
}
