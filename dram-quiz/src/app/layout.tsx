import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DRAM 가격, 얼마나 알고 있나요?",
  description: "한국은행 DRAM 수출물가지수로 맞혀 보는 숫자 퀴즈. 5문항 · 1분.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
