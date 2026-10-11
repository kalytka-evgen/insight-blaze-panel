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

## Architecture rules
- All data access goes through `src/lib/api.ts`; mock data lives only in `src/lib/mockData.ts` — so mocks can be swapped for a REST backend in one place.
- FIFO batch consumption lives only in `src/lib/fifo.ts` — shared by production estimates and reports.
- No Supabase/database and no auth — internal tool backed by an external REST API later.
- All UI strings are Ukrainian; formatting helpers in `src/lib/format.ts` (UAH, DD.MM.YYYY, CSV).
