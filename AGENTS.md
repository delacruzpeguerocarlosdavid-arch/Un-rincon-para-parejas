<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep existing public demo screens; private message administration lives under the authenticated layout to preserve navigation without exposing private content.
- Message writes and approval use authenticated PostgreSQL RPCs with membership checks; direct table writes are not granted, so UI controls are never the permission boundary.
- Roles live separately from editable profiles. Administrator identity is provisioned in service-only space configuration; only that administrator can authorize the second account.
- Daily selection is atomic in PostgreSQL, keyed by space and Dominican calendar date, with immutable content snapshots; scheduled dates take precedence and least-recently-used eligible messages rotate.
- Auth has a single root transition subscriber, and Realtime invalidates shared-message queries. Sign-out cancels and clears protected caches before clearing the session.
- Partner joins the private space only via a hashed, single-use, expiring invite code redeemed by the redeem_invite_code RPC; plaintext codes are never stored, so a leaked database row cannot be used to join.
- Membership provisioning is restricted to the configured administrator, and composing needs only active own membership, not a second account; table-specific trigger fields are read only inside their matching table branch to prevent invite failures without weakening lifecycle protection.
- Writing schemas validate client input before RPCs, matching database validation; invitation copy/share failures remain recoverable and plaintext codes exist only in the generating page's state.
- Profile edits go through the update_my_profile RPC (no direct UPDATE grant), so field validation lives in the database.
- Correspondence, library reads and favorites use membership-checked PostgreSQL RPCs and SELECT-only RLS; library mutations require authorship, favorites require the partner, and Realtime invalidates the shared correspondence query.
- Album, diaries and special dates use SELECT-only RLS plus author-checked RPCs; private diary rows are filtered by RLS to their author. Archiving sets archived_at, restore works for 30 days, permanent deletion requires an archived item, and a scheduled server route purges expired items and their photos.
- Memory photos live in the private "memories" bucket under <space_id>/; the client compresses to JPEG before upload and removes the file after permanent deletion (storage delete policy only allows files no memory row references).
- Daily emotions use a membership-checked own-user RPC and SELECT-only space RLS, keyed by Dominican day; a root Realtime subscription refreshes the home and feelings views. Moment links use validated library search parameters and partner-author filtering to preserve ownership boundaries.
- Spiritual items/check-ins use SELECT-only space RLS plus membership-checked RPCs; edits/deletes are author-only, any member may mark a petition answered; the soft streak is computed client-side from shared check-in days.
- Appa shared stats live in one row per space updated only by the appa_care RPC, which applies hourly decay (floor 10) on each write; the client mirrors the decay for display. Care, game results and purchases are RPC-only rows (server decides coins/EXP; purchases check the shared balance under an advisory lock; feeding consumes a pantry purchase).
- Appa rooms use one shared state and membership-checked bathroom/furniture RPCs; bath stage order and daily rewards are server-enforced, all food/furniture spending uses the same locked balance, and room placement permits one owned item per category per room.
- Capsule metadata and payloads are separate; payload RLS and opening/export RPCs enforce database time, including for authors, so sealed contents never leak through lists or backups.
- Word-search boards and discoveries are server-owned with one shared reward per word/day; use the vendored MIT BunKat solver for display and include discoveries in both Appa accounting paths.
- Space archive disables my_space and writes but retains export access through readable_space; departure records prevent rejoining historical data and protect it from scheduled purge. Changes consume short-lived server confirmations.
- Backups include embedded photos and requester-only private journals; local reminder preferences are device-scoped and notifications only run while the app is open.
- Home welcomes read the administrator's named library text through existing private queries; keep them editable/exportable without placing personal copy in public source.
- Emotional spaces reuse partner-library queries and the journal RPC for free writing; require explicit shared/private visibility rather than creating a parallel message store.
- The Bible catalog is a verbatim public-domain source module, separate from user spiritual entries; diary links select the existing shared/private journal view.
- Word search uses 100 server-owned levels (catalog words from love terms + the level's catalog verse); the next level's board is generated server-side once all words of the current one are found, and level finds/completions count in both Appa accounting paths.
