import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPostBySlug, getCurrentUser } from '@/app/actions';
import PostThread from '@/app/components/PostThread';
import SinglePostVote from './SinglePostVote';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const [post, currentUser] = await Promise.all([
    getPostBySlug(slug),
    getCurrentUser()
  ]);

  if (!post) {
    notFound();
  }

  const upvotes = post.votes?.filter((v: any) => v.type === 'up').length || 0;
  const downvotes = post.votes?.filter((v: any) => v.type === 'down').length || 0;
  const score = upvotes - downvotes;
  const userVote = currentUser 
    ? post.votes?.find((v: any) => v.userId === currentUser.id)?.type 
    : null;

  return (
    <main className="main-content">
      <div className="container">
        <Link href="/posts" className="back-link">
          ← Wróć do postów
        </Link>
        
        <article className="single-post">
          <header className="single-post-header">
            <h1 className="single-post-title">{post.title}</h1>
            <div className="single-post-meta">
              <span>Autor: <Link href={`/${post.author?.username}`}>{post.author?.username}</Link></span>
              <span className="meta-separator">•</span>
              <span>{new Date(post.createdAt).toLocaleDateString('pl-PL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
          </header>

          <div className="single-post-content">
            <p>{post.content}</p>
          </div>

          <SinglePostVote 
            postId={post.id}
            score={score}
            upvotes={upvotes}
            downvotes={downvotes}
            userVote={userVote}
            currentUser={currentUser}
          />

          <section className="single-post-replies">
            <h2>Komentarze ({post.replies?.length || 0})</h2>
            <PostThread 
              post={post}
              currentUser={currentUser} 
            />
          </section>
        </article>
      </div>
    </main>
  );
}
