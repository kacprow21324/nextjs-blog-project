import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { getSession, getCurrentUser } from '@/app/actions';
import Header from '@/app/components/Header';
import NewPostForm from '@/app/components/NewPostForm';
import PostList from '@/app/components/PostList';

export const metadata: Metadata = {
  title: 'Wypasiony Blog - Strona główna',
  description: 'Najlepszy blog w internecie',
};

// Strona główna - Server Component
export default async function HomePage() {
  // Sprawdź sesję - brak sesji = przekierowanie do logowania
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  // Pobierz pełne dane użytkownika
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  // Pobierz posty bezpośrednio z bazy (Server Component)
  const posts = await prisma.post.findMany({
    include: {
      author: {
        select: { id: true, username: true },
      },
      votes: true,
      replies: {
        include: {
          author: {
            select: { id: true, username: true },
          },
          votes: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="container">
      <Header user={currentUser} />
      <NewPostForm />
      <PostList posts={posts} currentUser={currentUser} />
    </div>
  );
}