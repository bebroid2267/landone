/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: false,
	experimental: {
		serverActions: true,
		missingSuspenseWithCSRBailout: false,
	},
	eslint: {
		ignoreDuringBuilds: true,
	},
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'images.leadconnectorhq.com',
			},
			{
				protocol: 'https',
				hostname: 'images.unsplash.com',
			},
		],
		dangerouslyAllowSVG: true,
		contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
	},
}

const withBundleAnalyzer = require('@next/bundle-analyzer')({
	enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
	env: {
		NEXT_PUBLIC_ENV: 'PRODUCTION',
	},
	...nextConfig,
})
