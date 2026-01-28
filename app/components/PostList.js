'use client';

import React, { useState } from 'react';
import PostThread from './PostThread';
import { votePost, deletePost } from '@/app/actions';

export default function PostList({ posts, currentUser }) {
  const [openPostId, setOpenPostId] = useState(null);
  const [loadingVote, setLoadingVote] = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(null);

  const handleVote = async (postId, type) => {
    if (!currentUser) return;
    setLoadingVote(postId);
    await votePost(postId, type);
    setLoadingVote(null);
  };

  const handleDelete = async (postId) => {
    if (!currentUser) return;
    if (!confirm('Czy na pewno chcesz usunąć ten post?')) return;
    setLoadingDelete(postId);
    await deletePost(postId);
    setLoadingDelete(null);
  };

  return (
    <div className="post-list">
      {posts.length === 0 ? (
        <div className="post">
          <p>Brak postów. Bądź pierwszy i dodaj coś!</p>
        </div>
      ) : (
        posts.map(p => {
          const isOpen = openPostId === p.id;
          
          const upvotes = p.votes?.filter(v => v.type === 'up').length || 0;
          const downvotes = p.votes?.filter(v => v.type === 'down').length || 0;
          const score = upvotes - downvotes;
          
          const userVote = currentUser 
            ? p.votes?.find(v => v.userId === currentUser.id)?.type 
            : null;

          const canDelete = currentUser && (
            currentUser.id === p.authorId || 
            currentUser.username === 'Admin'
          );

          return (
            <div key={p.id} className="post">
              <div className="post-header">
                <button
                  className="toggle-btn"
                  onClick={() => setOpenPostId(isOpen ? null : p.id)}
                  title={isOpen ? 'Zwiń komentarze' : 'Rozwiń komentarze'}
                >
                  {isOpen ? '▲' : '▼'}
                </button>
                <h3>{p.title}</h3>
              </div>

              <p className="post-author">Autor: {p.author?.username || 'Nieznany'}</p>

              <p className="post-content">{p.content}</p>

              <div className="post-footer">
                <span className="post-score-label">Ocena:</span>
                <span className={`post-score ${score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral'}`}>
                  {score > 0 ? '+' : ''}{score}
                </span>
                <div className="post-actions">
                  {currentUser && (
                    <>
                      <button
                        className={`btn-like ${userVote === 'up' ? 'active' : ''}`}
                        onClick={() => handleVote(p.id, 'up')}
                        disabled={loadingVote === p.id}
                      >
                        + Lubię
                      </button>
                      <button
                        className={`btn-dislike ${userVote === 'down' ? 'active' : ''}`}
                        onClick={() => handleVote(p.id, 'down')}
                        disabled={loadingVote === p.id}
                      >
                        − Nie lubię
                      </button>
                    </>
                  )}
                  
                  {canDelete && (
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(p.id)}
                      disabled={loadingDelete === p.id}
                    >
                      {loadingDelete === p.id ? 'Usuwanie...' : 'Usuń'}
                    </button>
                  )}
                </div>
              </div>

              {isOpen && (
                <PostThread
                  post={p}
                  currentUser={currentUser}
                />
              )}
            </div>
          );
        })
      )}
    </div>
  );
}