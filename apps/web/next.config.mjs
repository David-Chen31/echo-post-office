/** @type {import('next').NextConfig} */

// STATIC_EXPORT=true 时产出纯静态站点（GitHub Pages）；否则本地/同源用 rewrites 代理。
const isExport = process.env.STATIC_EXPORT === 'true';
// 项目页部署在 https://<user>.github.io/<repo> 时设 NEXT_PUBLIC_BASE_PATH=/<repo>
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const shared = {
  reactStrictMode: true,
  transpilePackages: ['@letter/shared'],
  eslint: { ignoreDuringBuilds: true },
};

const nextConfig = isExport
  ? {
      ...shared,
      output: 'export',
      images: { unoptimized: true },
      trailingSlash: true,
      basePath: basePath || undefined,
      assetPrefix: basePath || undefined,
    }
  : {
      ...shared,
      async rewrites() {
        // 开发期把 /api/* 代理到后端，规避跨域 cookie 问题
        return [
          {
            source: '/api/:path*',
            destination: `${process.env.API_PROXY_TARGET || 'http://localhost:4000'}/api/:path*`,
          },
        ];
      },
    };

export default nextConfig;
