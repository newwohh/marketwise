# Account watchlists and contributor publishing

These features use the same Supabase project as Marketwise authentication.
They are implemented for later configuration; unconfigured APIs return explicit
503 errors and the public pages retain device-local functionality.

1. Configure the public Supabase URL and anon/publishable key using the account
   setup guide. Never use a service-role key in browser configuration.
2. Apply all checked-in Supabase migrations in filename order, including the
   account/content tables, row-level-security policies, and
   `202611150003_watchlist.sql` transactional watchlist RPC.
3. Sign in as two separate test users and verify that each sees only their own
   watchlist and private drafts. Publishing makes the post readable publicly;
   unpublishing removes it from public queries.
4. From Markets, choose **Sync account watchlist** to merge device keys into the
   account. The merge/prune is one database transaction, serialized per account;
   it retains the newest 100 distinct assets and applies that authoritative
   chronological snapshot to this device. Failed syncs do not change local
   storage. Asset keys retain `market:provider-id` format (`crypto:bitcoin`).
5. From Blogs, create a field note in the existing notebook. **Save draft** writes
   to this browser only. Account publishing can create a separate private account
   draft or public post. Editing, unpublishing and deleting are author-scoped.

## API contracts

- `GET /api/watchlist`: signed-in account keys as `{items: string[]}`.
- `POST /api/watchlist`: `{items: string[]}` atomically merges and caps the
  account at 100 distinct assets using `sync_watchlist`. User IDs are derived
  inside SQL from `auth.uid()`, never request data. The response is ordered
  oldest-to-newest so the newest synced asset cannot disappear behind an
  oldest-100 database read.
- `DELETE /api/watchlist?market=crypto&symbol=bitcoin`: remove only that asset
  from the verified account.
- `GET /api/posts`: published contributor posts only.
- `GET /api/posts?mine=1`: the signed-in author's private and public posts.
- `POST /api/posts`: `{title,body,published}` creates an account post.
- `PATCH /api/posts/:id`: updates only a post owned by the verified account.
- `DELETE /api/posts/:id`: deletes only a post owned by the verified account.

POST/PATCH/DELETE requests require a same-origin Origin header. Configure
`NEXT_PUBLIC_SITE_URL` to the exact deployed site origin. Inputs reject extra
ownership fields. Content is displayed as plain text, never raw HTML. Public
author names are bounded snapshots of a display name; private profile/email
records are not exposed through joins.

The old backend's users, subscriptions and published articles have not been
silently migrated. Importing old content requires a deliberate user-ID mapping
and review of the original database. Existing device-local notebook entries
are preserved and never published automatically.
