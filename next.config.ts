import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  devIndicators: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '**'
      },
      {
        protocol: 'https',
        hostname: '**'
      }
    ]
  },
  async redirects() {
    return [
      {
        source: '/dashboard/products',
        destination: '/dashboard/master/products',
        permanent: true
      },
      {
        source: '/dashboard/products/:path*',
        destination: '/dashboard/master/products/:path*',
        permanent: true
      }
    ];
  },
  async rewrites() {
    return [
      // Typo handling: manajement-pengguna -> manajemen-pengguna
      {
        source: '/manajement-pengguna/:path*',
        destination: '/manajemen-pengguna/:path*'
      },
      // Roles sub-pages mapping under manajemen-pengguna
      {
        source: '/manajemen-pengguna/roles/:path*',
        destination: '/users/roles/:path*'
      },
      // English slug aliases under dashboard/master
      {
        source: '/dashboard/master/categories',
        destination: '/dashboard/master/kategori'
      },
      {
        source: '/dashboard/master/colors',
        destination: '/dashboard/master/warna'
      },
      {
        source: '/dashboard/master/sizes',
        destination: '/dashboard/master/ukuran'
      },
      {
        source: '/dashboard/master/materials',
        destination: '/dashboard/master/bahan'
      },
      {
        source: '/dashboard/master/topics',
        destination: '/dashboard/master/topik-blog'
      },
      {
        source: '/dashboard/master/banks',
        destination: '/dashboard/master/bank'
      }
    ];
  }
};

export default nextConfig;
