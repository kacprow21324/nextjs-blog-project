'use client';

import { useState } from 'react';
import { votePost } from '@/app/actions';

interface SinglePostVoteProps {
  postId: number;
  score: number;
  upvotes: number;
  downvotes: number;
  userVote: string | null;
  currentUser: any;
}

export default function SinglePostVote({ 
  postId, 
  score, 
  upvotes, 
  downvotes, 
  userVote, 
  currentUser 
}: SinglePostVoteProps) {
  const [loading, setLoading] = useState(false);

  const handleVote = async (type: 'up' | 'down') => {
    if (!currentUser) return;
    setLoading(true);
    await votePost(postId, type);
    setLoading(false);
  };

  return (
    <div className="single-post-votes">
      <button
        className={`btn-like ${userVote === 'up' ? 'active' : ''}`}
        onClick={() => handleVote('up')}
        disabled={!currentUser || loading}
        title={!currentUser ? 'Zaloguj się aby głosować' : 'Polub'}
      >
        + Lubię ({upvotes})
      </button>
      <span className={`vote-score ${score > 0 ? 'positive' : score < 0 ? 'negative' : ''}`}>
        {score > 0 ? '+' : ''}{score}
      </span>
      <button
        className={`btn-dislike ${userVote === 'down' ? 'active' : ''}`}
        onClick={() => handleVote('down')}
        disabled={!currentUser || loading}
        title={!currentUser ? 'Zaloguj się aby głosować' : 'Nie lubię'}
      >
        − Nie lubię ({downvotes})
      </button>
    </div>
  );
}
