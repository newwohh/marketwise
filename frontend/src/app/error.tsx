"use client";
export default function ErrorPage({ reset }: { reset: () => void }) { return <div className="section-pad empty-state not-found"><h1>A moment to regroup.</h1><p>We couldn’t load this view. Please try again.</p><button className="button" onClick={reset}>Try again ↗</button></div>; }
