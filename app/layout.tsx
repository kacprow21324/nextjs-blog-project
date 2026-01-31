import './globals.css';
import type { Metadata } from 'next';
import { getCurrentUser } from '@/app/actions';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Wypasiony Blog',
  description: 'Najlepszy blog w internecie - dołącz do społeczności!',
};

export default async function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const currentUser = await getCurrentUser();

  return (
    <html lang="pl">
      <body>
        <div className="app-wrapper">
          <Header user={currentUser} />
          <main className="main-content">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}