'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createReply, voteReply } from '@/app/actions';

const ReplyForm = React.memo(function ReplyForm({ replyText, onChange, onSend, loading }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.focus();
    const len = ref.current.value.length;
    ref.current.setSelectionRange(len, len);
  }, [replyText]);

  return (
    <div style={{ marginTop: '0.5rem' }}>
      <textarea
        ref={ref}
        placeholder="Twoja odpowiedź…"
        value={replyText}
        onChange={onChange}
        disabled={loading}
      />
      <button className="btn" onClick={onSend} disabled={loading} style={{ marginTop: '0.5rem' }}>
        {loading ? 'Wysyłanie...' : 'Wyślij'}
      </button>
    </div>
  );
});

export default function PostThread({ post, currentUser }) {
  const [replyText, setReplyText] = useState('');
  const [activeReplyTo, setActiveReplyTo] = useState(null);
  const [openMap, setOpenMap] = useState({});
  const [loadingReply, setLoadingReply] = useState(false);
  const [loadingVote, setLoadingVote] = useState(null);

  const toggleOpen = id => {
    setOpenMap(m => ({
      ...m,
      [id]: m[id] === undefined ? false : !m[id]
    }));
  };

  const handleVoteReply = async (replyId, type) => {
    if (!currentUser) return;
    setLoadingVote(replyId);
    await voteReply(replyId, type);
    setLoadingVote(null);
  };

  const handleReply = async (parentId = null) => {
    if (!replyText.trim() || !currentUser) return;
    setLoadingReply(true);
    await createReply(post.id, replyText, parentId);
    setReplyText('');
    setActiveReplyTo(null);
    setLoadingReply(false);
  };

  const topReplies = post.replies.filter(r => r.parentId == null);
  const childReplies = id => post.replies.filter(r => r.parentId === id);

  const ReplyItem = ({ r, depth = 0 }) => {
    const children = childReplies(r.id);
    const open = openMap[r.id] ?? true;
    
    const upvotes = r.votes?.filter(v => v.type === 'up').length || 0;
    const downvotes = r.votes?.filter(v => v.type === 'down').length || 0;
    const score = upvotes - downvotes;

    let cls = 'reply-score ';
    if (score > 0) cls += 'positive';
    else if (score < 0) cls += 'negative';
    else cls += 'neutral';

    return (
      <div className="reply" style={{ marginLeft: depth * 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {children.length > 0 && (
            <button
              className="toggle-btn"
              onClick={() => toggleOpen(r.id)}
              aria-label={open ? 'Zwiń wątek' : 'Rozwiń wątek'}
              title={open ? 'Zwiń wątek' : 'Rozwiń wątek'}
            >
              {open ? '−' : '+'}
            </button>
          )}
          <span style={{ fontSize: '0.85rem' }}>
            <strong>{r.author?.username || 'Nieznany'}</strong>: {r.text}
          </span>
        </div>

        {open && (
          <div style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {currentUser && (
                <>
                  <button 
                    className="btn-like" 
                    onClick={() => handleVoteReply(r.id, 'up')}
                    disabled={loadingVote === r.id}
                  >
                    + Lubię
                  </button>
                  <button 
                    className="btn-dislike" 
                    onClick={() => handleVoteReply(r.id, 'down')}
                    disabled={loadingVote === r.id}
                  >
                    − Nie lubię
                  </button>
                </>
              )}
              <span className={cls}>
                {score > 0 ? '+' : ''}{score}
              </span>
              {currentUser && (
                <button 
                  className="btn" 
                  onClick={() => setActiveReplyTo(activeReplyTo === r.id ? null : r.id)}
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                >
                  Odpowiedz
                </button>
              )}
            </div>

            {activeReplyTo === r.id && (
              <ReplyForm
                replyText={replyText}
                onChange={e => setReplyText(e.target.value)}
                loading={loadingReply}
                onSend={() => handleReply(r.id)}
              />
            )}

            {children.map(cr => (
              <ReplyItem key={`${r.id}-${cr.id}`} r={cr} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="post-thread">
      <h4>Odpowiedzi ({post.replies.length})</h4>

      {topReplies.map(r => (
        <ReplyItem key={r.id} r={r} />
      ))}

      {activeReplyTo === null && currentUser && (
        <div style={{ marginTop: '1rem' }}>
          <textarea
            placeholder="Napisz odpowiedź..."
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            disabled={loadingReply}
          />
          <button
            className="btn"
            onClick={() => handleReply(null)}
            disabled={loadingReply}
            style={{ marginTop: '0.5rem' }}
          >
            {loadingReply ? 'Wysyłanie...' : 'Odpowiedz'}
          </button>
        </div>
      )}

      {!currentUser && (
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Zaloguj się, aby odpowiadać na posty.
        </p>
      )}
    </div>
  );
}