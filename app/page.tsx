import type { Metadata } from 'next';
import Link from 'next/link';
import { getSession, getCurrentUser, getRandomPosts } from '@/app/actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Wypasiony Blog - Strona główna',
  description: 'Najlepszy blog w internecie - dołącz do społeczności!',
};

export default async function HomePage() {
  const session = await getSession();
  const currentUser = session ? await getCurrentUser() : null;
  const featuredPosts = await getRandomPosts(3);

  return (
    <div className="landing-page">
      {!currentUser && (
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              Witaj w <span className="hero-highlight">Wypasiony Blog</span>
            </h1>
            <p className="hero-subtitle">
              Dołącz do naszej społeczności, dziel się swoimi myślami i odkrywaj ciekawe treści od innych użytkowników.
            </p>
            <div className="hero-actions">
              <Link href="/register" className="btn btn-large">
                Dołącz do naszego bloga
              </Link>
              <Link href="/login" className="btn btn-outline btn-large">
                Zaloguj się
              </Link>
            </div>
          </div>
        </section>
      )}

      {currentUser && (
        <section className="welcome-section">
          <h1 className="welcome-title">
            Cześć, <span className="hero-highlight">{currentUser.username}</span>!
          </h1>
          <p className="welcome-subtitle">
            Co nowego dzisiaj napiszesz?
          </p>
          <div className="welcome-actions">
            <Link href="/posts" className="btn btn-large">
              Przeglądaj posty
            </Link>
          </div>
          <hr className="section-divider" />
        </section>
      )}

      <section className="featured-section">
        <h2 className="section-title">Wyróżnione posty</h2>
        <div className="featured-posts">
          {featuredPosts.length > 0 ? (
            featuredPosts.map((post) => {
              const upvotes = post.votes?.filter((v: any) => v.type === 'up').length || 0;
              const downvotes = post.votes?.filter((v: any) => v.type === 'down').length || 0;
              const score = upvotes - downvotes;
              
              return (
                <article key={post.id} className="featured-post-card">
                  <h3 className="featured-post-title">{post.title}</h3>
                  <p className="featured-post-author">
                    Autor: <Link href={`/${post.author.username}`}>{post.author.username}</Link>
                  </p>
                  <p className="featured-post-excerpt">
                    {post.content.length > 150 
                      ? post.content.substring(0, 150) + '...' 
                      : post.content}
                  </p>
                  <div className="featured-post-meta">
                    <span className="featured-post-score">
                      {score} punktów
                    </span>
                    <span className="featured-post-replies">
                      {post.replies?.length || 0} odpowiedzi
                    </span>
                  </div>
                </article>
              );
            })
          ) : (
            <p className="no-posts-message">Brak postów do wyświetlenia. Bądź pierwszy!</p>
          )}
        </div>
      </section>
    </div>
  );
}