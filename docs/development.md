# Development

This project uses [pnpm](https://pnpm.io).

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The page auto-updates as you edit files under `src/`.

## Other scripts

```bash
pnpm build   # production build (static export, see Deployment below)
pnpm start   # run the production build
pnpm lint    # lint the codebase
```

## Deployment

The app is fully client-rendered, so it builds to a static export (`next.config.ts` sets `output: 'export'`) and is hosted for free on **GitHub Pages**. Pushing to `main` triggers [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml), which builds the site and publishes `out/` via GitHub Actions — no manual steps beyond enabling Pages (Settings → Pages → Source → GitHub Actions) once.

Live at **https://soorajks.github.io/Trocho/**.
