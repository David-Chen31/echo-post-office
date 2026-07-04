/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 让 Next 能编译 monorepo 内的共享包
  transpilePackages: ['@letter/shared'],
  eslint: { ignoreDuringBuilds: true },
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
