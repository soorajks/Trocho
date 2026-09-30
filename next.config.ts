import type { NextConfig } from "next";

// GitHub Pages serves project repos at /<repo-name>/, so assets need a matching basePath.
// GITHUB_REPOSITORY (e.g. "you/spirotext-studio") is set automatically inside GitHub Actions.
// A <username>.github.io repo serves at the domain root, so it gets no basePath.
const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const basePath = repoName && !repoName.endsWith(".github.io") ? `/${repoName}` : "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  images: {
    // next/image's default optimizer needs a server; static export has none.
    unoptimized: true,
  },
};

export default nextConfig;
