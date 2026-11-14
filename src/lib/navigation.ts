// Preserve old Marketwise bookmarks while canonical routes use the rebuilt screens.
export const legacyRedirects = [
  { source: "/education", destination: "/learn", permanent: true },
  { source: "/investsimulator", destination: "/simulator", permanent: true },
  { source: "/profile", destination: "/account", permanent: true },
  { source: "/login", destination: "/account", permanent: true },
  { source: "/sign-up", destination: "/account", permanent: true },
  { source: "/subscription", destination: "/pricing", permanent: true },
];
export const productLinks = [
  { href: "/cryptocurrency", title: "Cryptocurrency", text: "Prices, seven-day trends, and your watchlist.", icon: "↗" },
  { href: "/stocks", title: "Stock markets", text: "Explore equities and open a full technical chart.", icon: "+" },
  { href: "/forex", title: "Currencies", text: "Daily reference rates across major currency pairs.", icon: "⇄" },
  { href: "/heatmap/cryptocurrency", title: "Market heatmaps", text: "See price changes across crypto and stocks.", icon: "▦" },
  { href: "/simulator", title: "Investment simulator", text: "Model growth, contributions, and time horizons.", icon: "⌁" },
  { href: "/learn", title: "Trading academy", text: "Build foundations, with read-aloud field notes.", icon: "✳" },
  { href: "/news", title: "Market news", text: "Headlines from publishers, with links to the source.", icon: "≋" },
  { href: "/blogs", title: "Blogs & field notes", text: "Read ideas and keep a personal research notebook.", icon: "↗" },
];
export const academyAnchors: Record<string, string> = { "what-is-trading": "what-is-trading", "trading-accounts": "open-account", "reading-market-data": "read-trading", "technical-analysis": "learn-analyze", "practice-trading": "practice-trading", "risk-management": "manage-risk" };
