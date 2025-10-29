import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: undefined, // Явно отключаем статический экспорт
  experimental: {
    // Отключаем экспериментальные функции, которые могут влиять на сборку
  },
};

export default nextConfig;
