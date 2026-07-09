# BitFinite Stats

The live **pool & solo mining stats dashboard** for BitFinite (BFX) — hashrate,
workers, blocks, and payouts, with separate **Solo** and **Pool** views.

**Live:** https://ckpool.bitfinitechain.org

## Lineage & license

A fork of [**mrv777/ckstats**](https://github.com/mrv777/ckstats), re-branded and
adapted for BitFinite's ckpool. Licensed under **GPL-3.0** (inherited from
upstream) — see [LICENSE](LICENSE).

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind, **next-themes** (light/dark)
- **socket.io** live updates (custom `server.ts`, run via `tsx`)
- **Prisma** (schema in `prisma/`)
- Reads ckpool's on-disk state (`pool/pool.status`, `users/`, `ckpool.log`) for
  both the Solo source and the shared-Pool source.

## Getting started

```bash
pnpm install
pnpm dev            # tsx server.ts
```

Point the ckpool log/state directories at your pool via the env vars in
`.env.example` (`CKPOOL_LOGS_DIR` for solo, `POOL_CKPOOL_LOGS_DIR` for the shared
pool).

## Build & deploy

```bash
pnpm build          # next build
pnpm start          # NODE_ENV=production tsx server.ts
```

Production runs under **pm2** as `bitfinite-stats` (port 3004), behind nginx.
Deploy is `git pull` → `pnpm install` → `pnpm build` → `pm2 restart bitfinite-stats`.

## License

GPL-3.0 — see [LICENSE](LICENSE).
