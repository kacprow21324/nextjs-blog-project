'use server';

import { prisma } from '@/lib/prisma';
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

  const user = await prisma.user.findUnique({
    where: { username },
  });

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

  const existingUser = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUser) {
    return { success: false, error: 'Taki użytkownik już istnieje' };
  }

  try {
    await prisma.user.create({
      data: { username, password },
    });

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

/**
 * Pobiera pełne dane zalogowanego użytkownika
 */
export async function getCurrentUser() {
  const session = await getSession();
  
  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, username: true, createdAt: true },
  });

  return user;
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
    await prisma.post.create({
      data: {
        title,
        content,
        authorId: session.userId,
      },
    });

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

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { author: true },
  });

  if (!post) {
    return { success: false, error: 'Post nie istnieje' };
  }

  // Sprawdź uprawnienia
  if (post.authorId !== session.userId && session.username !== 'Admin') {
    return { success: false, error: 'Brak uprawnień do usunięcia' };
  }

  await prisma.post.delete({
    where: { id: postId },
  });

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

  const existingVote = await prisma.vote.findUnique({
    where: {
      userId_postId: { userId: session.userId, postId },
    },
  });

  if (existingVote) {
    if (existingVote.type === type) {
      // Anuluj głos
      await prisma.vote.delete({ where: { id: existingVote.id } });
    } else {
      // Zmień głos
      await prisma.vote.update({
        where: { id: existingVote.id },
        data: { type },
      });
    }
  } else {
    // Nowy głos
    await prisma.vote.create({
      data: { type, userId: session.userId, postId },
    });
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
    await prisma.reply.create({
      data: {
        text: text.trim(),
        postId,
        authorId: session.userId,
        parentId,
      },
    });

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

  const existingVote = await prisma.vote.findUnique({
    where: {
      userId_replyId: { userId: session.userId, replyId },
    },
  });

  if (existingVote) {
    if (existingVote.type === type) {
      await prisma.vote.delete({ where: { id: existingVote.id } });
    } else {
      await prisma.vote.update({
        where: { id: existingVote.id },
        data: { type },
      });
    }
  } else {
    await prisma.vote.create({
      data: { type, userId: session.userId, replyId },
    });
  }

  revalidatePath('/');
  return { success: true };
}

// ==================== DATA FETCHING ====================

/**
 * Pobieranie wszystkich postów z autorami, głosami i odpowiedziami
 */
export async function getPosts() {
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

  return posts;
}