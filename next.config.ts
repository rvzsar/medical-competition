import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: undefined, // Явно отключаем статический экспорт
  eslint: {
    // Игнорировать ESLint ошибки при сборке (проверка будет в CI)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Игнорировать TypeScript ошибки при сборке (проверка будет в CI)
    ignoreBuildErrors: true,
  },
  experimental: {
    // Отключаем экспериментальные функции, которые могут влиять на сборку
  },
};

export default nextConfig;
