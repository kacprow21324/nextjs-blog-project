import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wypasiony Blog',
  description: 'Najlepszy blog w internecie - dołącz do społeczności!',
};

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <html lang="pl">
      <body>
        {children}
      </body>
    </html>
  );
}