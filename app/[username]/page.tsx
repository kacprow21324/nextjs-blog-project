import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getUserByUsername, getUserPosts, getUserReplies, getUserTotalLikes, getSession } from '@/app/actions';

export const dynamic = 'force-dynamic';

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  
  return {
    title: `${username} - Profil użytkownika | Wypasiony Blog`,
    description: `Profil użytkownika ${username} na Wypasiony Blog`,
  };
}

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params;
  const session = await getSession();
  const user = await getUserByUsername(username);
  
  if (!user) {
    notFound();
  }

  const [userPosts, userReplies, totalLikes] = await Promise.all([
    getUserPosts(user.id),
    getUserReplies(user.id),
    getUserTotalLikes(user.id),
  ]);

  const isOwnProfile = session?.userId === user.id;

  return (
    <div className="container">
      <div className="profile-page">
        <section className="profile-header">
          <div className="profile-avatar">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="profile-info">
            <h1 className="profile-username">{user.username}</h1>
            {isOwnProfile && (
              <span className="profile-badge">To Twój profil</span>
            )}
            <p className="profile-joined">
              Dołączył: {new Date(user.createdAt).toLocaleDateString('pl-PL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </section>

        <section className="profile-stats">
          <div className="stat-card">
            <span className="stat-value">{userPosts.length}</span>
            <span className="stat-label">Postów</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{userReplies.length}</span>
            <span className="stat-label">Odpowiedzi</span>
          </div>
          <div className="stat-card stat-highlight">
            <span className="stat-value">{totalLikes}</span>
            <span className="stat-label">Polubień</span>
          </div>
        </section>

        <section className="profile-section">
          <h2 className="section-title">Posty użytkownika ({userPosts.length})</h2>
          
          {userPosts.length > 0 ? (
            <div className="profile-posts">
              {userPosts.map((post) => {
                const upvotes = post.votes?.filter((v: any) => v.type === 'up').length || 0;
                const downvotes = post.votes?.filter((v: any) => v.type === 'down').length || 0;
                const score = upvotes - downvotes;
                
                return (
                  <article key={post.id} className="profile-post-card">
                    <Link href={`/posts/${slugify(post.title)}`} className="profile-post-title-link">
                      <h3 className="profile-post-title">{post.title}</h3>
                    </Link>
                    <p className="profile-post-excerpt">
                      {post.content.length > 200 
                        ? post.content.substring(0, 200) + '...' 
                        : post.content}
                    </p>
                    <div className="profile-post-meta">
                      <span className="profile-post-date">
                        {new Date(post.createdAt).toLocaleDateString('pl-PL')}
                      </span>
                      <span className="profile-post-score">
                        {score} | {post.replies?.length || 0} odpowiedzi
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="empty-message">Ten użytkownik nie napisał jeszcze żadnych postów.</p>
          )}
        </section>

        <section className="profile-section">
          <h2 className="section-title">Odpowiedzi użytkownika ({userReplies.length})</h2>
          
          {userReplies.length > 0 ? (
            <div className="profile-replies">
              {userReplies.map((reply) => (
                <article key={reply.id} className="profile-reply-card">
                  <p className="profile-reply-text">"{reply.text}"</p>
                  <div className="profile-reply-meta">
                    <span className="profile-reply-post">
                      W poście: <Link href={`/posts/${slugify(reply.postTitle || '')}`} className="profile-reply-post-link"><strong>{reply.postTitle || 'Nieznany post'}</strong></Link>
                    </span>
                    <span className="profile-reply-date">
                      {new Date(reply.createdAt).toLocaleDateString('pl-PL')}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-message">Ten użytkownik nie napisał jeszcze żadnych odpowiedzi.</p>
          )}
        </section>

        <div className="profile-back">
          <Link href="/posts" className="btn btn-outline">
            Wróć do postów
          </Link>
        </div>
      </div>
    </div>
  );
}
