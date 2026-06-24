import './globals.css';
import { Bebas_Neue, DM_Mono, DM_Sans } from 'next/font/google';

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas-neue',
});

const dmMono = DM_Mono({
  weight: ['300', '400', '500'],
  subsets: ['latin'],
  variable: '--font-dm-mono',
});

const dmSans = DM_Sans({
  weight: ['300', '400', '500', '600', '700', '900'],
  subsets: ['latin'],
  variable: '--font-dm-sans',
});

export const metadata = {
  title: 'Media Mosh',
  description: 'Pro-Grade Browser-based Media Processing Toolkit',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${dmMono.variable} ${dmSans.variable}`}>
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
