import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '사주 바이브 | 나의 사주로 알아보는 음악 취향',
  description:
    '생년월일시를 입력하면 AI가 사주팔자를 분석하고 당신만의 음악 바이브를 찾아드립니다.',
  openGraph: {
    title: '사주 바이브',
    description: '사주팔자로 알아보는 나만의 음악 취향',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
