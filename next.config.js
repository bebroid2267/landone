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
				hostname: 'cfngdoszuhfiujrgozih.supabase.co',
			},
			{
				protocol: 'https',
				hostname: 'lh3.googleusercontent.com',
			},
			{
				protocol: 'https',
				hostname: 'soyfxhyasghymffubbhi.supabase.co',
			},
			{
				protocol: 'https',
				hostname: 'yralcgckodgemrozhvhn.supabase.co',
			},
			{
				protocol: 'https',
				hostname: 'epdeijkqhklbeinsbtqx.supabase.co',
			},
			{
				protocol: 'https',
				hostname: 'placehold.co',
			},
			{
				protocol: 'https',
				hostname: 'images.unsplash.com',
			},
		],
		dangerouslyAllowSVG: true,
		contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
	},
	async headers() {
		return [
			{
				source: '/api/send-mail',
				headers: [
					{ key: 'Access-Control-Allow-Credentials', value: 'true' },
					{ key: 'Access-Control-Allow-Origin', value: '*' },
					{ key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
					{ key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
				],
			},
		]
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
