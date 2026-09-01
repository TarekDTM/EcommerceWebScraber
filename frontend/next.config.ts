import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    reactStrictMode: true,
  poweredByHeader: false,
   images:{
        remotePatterns: [new URL('https://www.jumia.com.eg'),new URL("https://books.toscrape.com")],

  }
};

export default nextConfig;
