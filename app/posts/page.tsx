import type { Metadata } from 'next';
import { getCurrentUser, getPosts } from '@/app/actions';
import NewPostForm from '@/app/components/NewPostForm';
import PostList from '@/app/components/PostList';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Posty - Wypasiony Blog',
  description: 'Przeglądaj wszystkie posty na Wypasiony Blog',
};

export default async function PostsPage() {
  const currentUser = await getCurrentUser();
  const posts = await getPosts();

  return (
    <div className="container">
      <div className="posts-page-header">
        <h1 className="page-title">Wszystkie posty</h1>
        <p className="page-subtitle">Przeglądaj, komentuj i głosuj na posty społeczności</p>
      </div>
      
      {currentUser && <NewPostForm />}
      <PostList posts={posts} currentUser={currentUser} />
    </div>
  );
}
