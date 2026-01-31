'use server';

import { sql } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// ==================== AUTH ACTIONS ====================

/**
 * Logowanie użytkownika - zapisuje sesję w ciasteczku
 */
export async function login(formData) {
  const username = formData.get('username');
  const password = formData.get('password');

  if (!username || !password) {
    return { success: false, error: 'Wypełnij wszystkie pola' };
  }

  const users = await sql`
    SELECT "id", "username", "password" FROM "User" WHERE "username" = ${username}
  `;
  const user = users[0];

  if (!user || user.password !== password) {
    return { success: false, error: 'Niepoprawne dane logowania' };
  }

  // Zapisz sesję w ciasteczku (HttpOnly dla bezpieczeństwa)
  const cookieStore = await cookies();
  cookieStore.set('session', JSON.stringify({ userId: user.id, username: user.username }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 dni
    path: '/',
  });

  revalidatePath('/');
  redirect('/');
}

/**
 * Rejestracja nowego użytkownika
 */
export async function register(formData) {
  const username = formData.get('username');
  const password = formData.get('password');

  if (!username || !password) {
    return { success: false, error: 'Wypełnij wszystkie pola' };
  }

  if (username.length < 3) {
    return { success: false, error: 'Nazwa użytkownika musi mieć minimum 3 znaki' };
  }

  if (password.length < 6) {
    return { success: false, error: 'Hasło musi mieć minimum 6 znaków' };
  }

  const existingUsers = await sql`
    SELECT "id" FROM "User" WHERE "username" = ${username}
  `;

  if (existingUsers.length > 0) {
    return { success: false, error: 'Taki użytkownik już istnieje' };
  }

  try {
    await sql`
      INSERT INTO "User" ("username", "password") VALUES (${username}, ${password})
    `;

    return { success: true, message: `Użytkownik ${username} został zarejestrowany` };
  } catch (error) {
    return { success: false, error: 'Błąd podczas rejestracji' };
  }
}

/**
 * Wylogowanie użytkownika - usuwa ciasteczko sesji
 */
export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
  revalidatePath('/');
  redirect('/login');
}

/**
 * Pobiera aktualną sesję użytkownika z ciasteczka
 */
export async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  if (!sessionCookie) {
    return null;
  }

  try {
    return JSON.parse(sessionCookie.value);
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getSession();
  
  if (!session) {
    return null;
  }

  const users = await sql`
    SELECT "id", "username", "createdAt" FROM "User" WHERE "id" = ${session.userId}
  `;

  if (!users[0]) return null;
  
  return {
    id: users[0].id,
    username: users[0].username,
    createdAt: users[0].createdAt ? users[0].createdAt.toISOString() : null
  };
}

// ==================== POST ACTIONS ====================

/**
 * Tworzenie nowego posta
 */
export async function createPost(formData) {
  const session = await getSession();
  
  if (!session) {
    return { success: false, error: 'Musisz być zalogowany' };
  }

  const title = formData.get('title');
  const content = formData.get('content');

  if (!title || !content) {
    return { success: false, error: 'Wypełnij tytuł i treść' };
  }

  try {
    await sql`
      INSERT INTO "Post" ("title", "content", "authorId")
      VALUES (${title}, ${content}, ${session.userId})
    `;

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Błąd podczas tworzenia posta' };
  }
}

/**
 * Usuwanie posta (tylko autor lub Admin)
 */
export async function deletePost(postId) {
  const session = await getSession();
  
  if (!session) {
    return { success: false, error: 'Musisz być zalogowany' };
  }

  const posts = await sql`
    SELECT p."id", p."authorId", u."username" as "authorUsername"
    FROM "Post" p
    JOIN "User" u ON p."authorId" = u."id"
    WHERE p."id" = ${postId}
  `;
  const post = posts[0];

  if (!post) {
    return { success: false, error: 'Post nie istnieje' };
  }

  // Sprawdź uprawnienia
  if (post.authorId !== session.userId && session.username !== 'Admin') {
    return { success: false, error: 'Brak uprawnień do usunięcia' };
  }

  await sql`DELETE FROM "Post" WHERE "id" = ${postId}`;

  revalidatePath('/');
  return { success: true };
}

/**
 * Głosowanie na post (like/dislike)
 */
export async function votePost(postId, type) {
  const session = await getSession();
  
  if (!session) {
    return { success: false, error: 'Musisz być zalogowany' };
  }

  if (type !== 'up' && type !== 'down') {
    return { success: false, error: 'Nieprawidłowy typ głosu' };
  }

  const existingVotes = await sql`
    SELECT "id", "type" FROM "Vote" 
    WHERE "userId" = ${session.userId} AND "postId" = ${postId}
  `;
  const existingVote = existingVotes[0];

  if (existingVote) {
    if (existingVote.type === type) {
      // Anuluj głos
      await sql`DELETE FROM "Vote" WHERE "id" = ${existingVote.id}`;
    } else {
      // Zmień głos
      await sql`UPDATE "Vote" SET "type" = ${type} WHERE "id" = ${existingVote.id}`;
    }
  } else {
    // Nowy głos
    await sql`
      INSERT INTO "Vote" ("type", "userId", "postId")
      VALUES (${type}, ${session.userId}, ${postId})
    `;
  }

  revalidatePath('/');
  return { success: true };
}

// ==================== REPLY ACTIONS ====================

/**
 * Dodawanie odpowiedzi do posta
 */
export async function createReply(postId, text, parentId = null) {
  const session = await getSession();
  
  if (!session) {
    return { success: false, error: 'Musisz być zalogowany' };
  }

  if (!text || text.trim() === '') {
    return { success: false, error: 'Odpowiedź nie może być pusta' };
  }

  try {
    await sql`
      INSERT INTO "Reply" ("text", "postId", "authorId", "parentId")
      VALUES (${text.trim()}, ${postId}, ${session.userId}, ${parentId})
    `;

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Błąd podczas dodawania odpowiedzi' };
  }
}

/**
 * Głosowanie na odpowiedź
 */
export async function voteReply(replyId, type) {
  const session = await getSession();
  
  if (!session) {
    return { success: false, error: 'Musisz być zalogowany' };
  }

  if (type !== 'up' && type !== 'down') {
    return { success: false, error: 'Nieprawidłowy typ głosu' };
  }

  const existingVotes = await sql`
    SELECT "id", "type" FROM "Vote" 
    WHERE "userId" = ${session.userId} AND "replyId" = ${replyId}
  `;
  const existingVote = existingVotes[0];

  if (existingVote) {
    if (existingVote.type === type) {
      await sql`DELETE FROM "Vote" WHERE "id" = ${existingVote.id}`;
    } else {
      await sql`UPDATE "Vote" SET "type" = ${type} WHERE "id" = ${existingVote.id}`;
    }
  } else {
    await sql`
      INSERT INTO "Vote" ("type", "userId", "replyId")
      VALUES (${type}, ${session.userId}, ${replyId})
    `;
  }

  revalidatePath('/');
  return { success: true };
}

// ==================== DATA FETCHING ====================

/**
 * Pomocnicza funkcja slugify
 */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Pobieranie posta po slug (tytuł zamieniony na URL)
 */
export async function getPostBySlug(slug) {
  // Pobierz wszystkie posty
  const posts = await sql`
    SELECT 
      p."id", p."title", p."content", p."createdAt", p."updatedAt", p."authorId",
      u."id" as "author_id", u."username" as "author_username"
    FROM "Post" p
    JOIN "User" u ON p."authorId" = u."id"
  `;

  // Znajdź post o pasującym slug
  const post = posts.find(p => slugify(p.title) === slug);
  
  if (!post) {
    return null;
  }

  // Pobierz głosy na ten post
  const postVotes = await sql`
    SELECT "id", "type", "userId", "postId" FROM "Vote" WHERE "postId" = ${post.id}
  `;

  // Pobierz odpowiedzi z autorami
  const replies = await sql`
    SELECT 
      r."id", r."text", r."createdAt", r."postId", r."authorId", r."parentId",
      u."id" as "author_id", u."username" as "author_username"
    FROM "Reply" r
    JOIN "User" u ON r."authorId" = u."id"
    WHERE r."postId" = ${post.id}
    ORDER BY r."createdAt" ASC
  `;

  // Pobierz głosy na odpowiedzi
  const replyIds = replies.map(r => r.id);
  const replyVotes = replyIds.length > 0 ? await sql`
    SELECT "id", "type", "userId", "replyId" FROM "Vote" WHERE "replyId" = ANY(${replyIds})
  ` : [];

  return {
    id: post.id,
    title: post.title,
    content: post.content,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    authorId: post.authorId,
    author: {
      id: post.author_id,
      username: post.author_username,
    },
    votes: postVotes,
    replies: replies.map(reply => ({
      id: reply.id,
      text: reply.text,
      createdAt: reply.createdAt,
      postId: reply.postId,
      authorId: reply.authorId,
      parentId: reply.parentId,
      author: {
        id: reply.author_id,
        username: reply.author_username,
      },
      votes: replyVotes.filter(v => v.replyId === reply.id),
    })),
  };
}

/**
 * Pobieranie wszystkich postów z autorami, głosami i odpowiedziami
 */
export async function getPosts() {
  // Pobierz posty z autorami
  const posts = await sql`
    SELECT 
      p."id", p."title", p."content", p."createdAt", p."updatedAt", p."authorId",
      u."id" as "author_id", u."username" as "author_username"
    FROM "Post" p
    JOIN "User" u ON p."authorId" = u."id"
    ORDER BY p."createdAt" DESC
  `;

  // Pobierz wszystkie głosy na posty
  const postVotes = await sql`
    SELECT "id", "type", "userId", "postId" FROM "Vote" WHERE "postId" IS NOT NULL
  `;

  // Pobierz wszystkie odpowiedzi z autorami
  const replies = await sql`
    SELECT 
      r."id", r."text", r."createdAt", r."postId", r."authorId", r."parentId",
      u."id" as "author_id", u."username" as "author_username"
    FROM "Reply" r
    JOIN "User" u ON r."authorId" = u."id"
    ORDER BY r."createdAt" ASC
  `;

  // Pobierz wszystkie głosy na odpowiedzi
  const replyVotes = await sql`
    SELECT "id", "type", "userId", "replyId" FROM "Vote" WHERE "replyId" IS NOT NULL
  `;

  // Złóż dane w strukturę podobną do Prisma
  return posts.map(post => ({
    id: post.id,
    title: post.title,
    content: post.content,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    authorId: post.authorId,
    author: {
      id: post.author_id,
      username: post.author_username,
    },
    votes: postVotes.filter(v => v.postId === post.id),
    replies: replies
      .filter(r => r.postId === post.id)
      .map(reply => ({
        id: reply.id,
        text: reply.text,
        createdAt: reply.createdAt,
        postId: reply.postId,
        authorId: reply.authorId,
        parentId: reply.parentId,
        author: {
          id: reply.author_id,
          username: reply.author_username,
        },
        votes: replyVotes.filter(v => v.replyId === reply.id),
      })),
  }));
}

/**
 * Pobiera losowe/popularne posty (do wyświetlenia na stronie głównej)
 */
export async function getRandomPosts(limit = 3) {
  const posts = await sql`
    SELECT 
      p."id", p."title", p."content", p."createdAt", p."authorId",
      u."id" as "author_id", u."username" as "author_username"
    FROM "Post" p
    JOIN "User" u ON p."authorId" = u."id"
    ORDER BY RANDOM()
    LIMIT ${limit}
  `;

  const postIds = posts.map(p => p.id);
  
  if (postIds.length === 0) {
    return [];
  }

  const postVotes = await sql`
    SELECT "id", "type", "postId" FROM "Vote" WHERE "postId" = ANY(${postIds})
  `;

  const replies = await sql`
    SELECT "id", "postId" FROM "Reply" WHERE "postId" = ANY(${postIds})
  `;

  return posts.map(post => ({
    id: post.id,
    title: post.title,
    content: post.content,
    createdAt: post.createdAt,
    authorId: post.authorId,
    author: {
      id: post.author_id,
      username: post.author_username,
    },
    votes: postVotes.filter(v => v.postId === post.id),
    replies: replies.filter(r => r.postId === post.id),
  }));
}

/**
 * Pobiera użytkownika po username
 */
export async function getUserByUsername(username) {
  const users = await sql`
    SELECT "id", "username", "createdAt" FROM "User" WHERE "username" = ${username}
  `;
  return users[0] || null;
}

/**
 * Pobiera wszystkie posty danego użytkownika
 */
export async function getUserPosts(userId) {
  const posts = await sql`
    SELECT 
      p."id", p."title", p."content", p."createdAt", p."authorId",
      u."username" as "author_username"
    FROM "Post" p
    JOIN "User" u ON p."authorId" = u."id"
    WHERE p."authorId" = ${userId}
    ORDER BY p."createdAt" DESC
  `;

  const postIds = posts.map(p => p.id);
  
  if (postIds.length === 0) {
    return [];
  }

  const postVotes = await sql`
    SELECT "id", "type", "postId" FROM "Vote" WHERE "postId" = ANY(${postIds})
  `;

  const replies = await sql`
    SELECT "id", "postId" FROM "Reply" WHERE "postId" = ANY(${postIds})
  `;

  return posts.map(post => ({
    id: post.id,
    title: post.title,
    content: post.content,
    createdAt: post.createdAt,
    authorId: post.authorId,
    votes: postVotes.filter(v => v.postId === post.id),
    replies: replies.filter(r => r.postId === post.id),
  }));
}

/**
 * Pobiera wszystkie odpowiedzi danego użytkownika wraz z tytułami postów
 */
export async function getUserReplies(userId) {
  const replies = await sql`
    SELECT 
      r."id", r."text", r."createdAt", r."postId",
      p."title" as "postTitle"
    FROM "Reply" r
    LEFT JOIN "Post" p ON r."postId" = p."id"
    WHERE r."authorId" = ${userId}
    ORDER BY r."createdAt" DESC
  `;

  return replies.map(reply => ({
    id: reply.id,
    text: reply.text,
    createdAt: reply.createdAt,
    postId: reply.postId,
    postTitle: reply.postTitle,
  }));
}

/**
 * Oblicza łączną liczbę polubień (upvotes) dla wszystkich postów użytkownika
 */
export async function getUserTotalLikes(userId) {
  const result = await sql`
    SELECT COUNT(*) as "totalLikes"
    FROM "Vote" v
    JOIN "Post" p ON v."postId" = p."id"
    WHERE p."authorId" = ${userId} AND v."type" = 'up'
  `;
  
  return parseInt(result[0]?.totalLikes || '0', 10);
}
