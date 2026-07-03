/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  reactStrictMode: true,
  transpilePackages: [
    "@ctn/api-contracts",
    "@ctn/constants",
    "@ctn/types",
    "@ctn/utils",
    "@ctn/validation",
  ],
};

export default nextConfig;
