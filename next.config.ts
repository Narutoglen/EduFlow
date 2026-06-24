import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// Content Security Policy tuned to what the app actually loads:
//  - Unsplash for course/avatar imagery (img-src)
//  - YouTube embeds on the lesson player (frame-src)
//  - inline styles/scripts that Next.js + Tailwind emit (no nonce pipeline yet)
// Applied in production only so it doesn't interfere with the dev HMR runtime
// (which needs 'unsafe-eval').
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "img-src 'self' data: https://images.unsplash.com",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "connect-src 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
        { key: "Content-Security-Policy", value: csp },
      ]
    : []),
];

const nextConfig: NextConfig = {
<<<<<<< HEAD
  // Self-contained server output for Docker/production deployment.
  output: "standalone",
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
=======
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
>>>>>>> 1c01f0308f5fafe3f3ca847d57554f19db9da16a
  },
};

export default nextConfig;
