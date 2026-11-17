import type { User } from '../types';

const USERS_STORAGE_KEY = 'enspirewrite_users_v1';
const CURRENT_SESSION_KEY = 'enspirewrite_session_user_id_v1';

// Standard SHA-256 password hashing using built-in browser Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export class AuthService {
  private getUsers(): User[] {
    try {
      const data = localStorage.getItem(USERS_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch {}
    return [];
  }

  private saveUsers(users: User[]): void {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.warn('Failed to save users', e);
    }
  }

  public getCurrentUser(): User | null {
    try {
      const currentId = localStorage.getItem(CURRENT_SESSION_KEY);
      if (!currentId) return null;
      const users = this.getUsers();
      return users.find((u) => u.id === currentId) || null;
    } catch {
      return null;
    }
  }

  public getAllUsers(): User[] {
    return this.getUsers();
  }

  public async signUp(
    name: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (!trimmedName) {
      return { success: false, error: 'Please enter your name or pen name.' };
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!password || password.length < 6) {
      return {
        success: false,
        error: 'Password must be at least 6 characters long.',
      };
    }

    const users = this.getUsers();
    const existing = users.find((u) => u.email === trimmedEmail);
    if (existing) {
      return {
        success: false,
        error: 'An author ledger with this email already exists.',
      };
    }

    const passwordHash = await hashPassword(password);
    const newUser: User = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: trimmedName,
      email: trimmedEmail,
      passwordHash,
      createdAt: new Date().toISOString(),
      avatarLetter: trimmedName.charAt(0).toUpperCase() || 'W',
    };

    users.push(newUser);
    this.saveUsers(users);
    localStorage.setItem(CURRENT_SESSION_KEY, newUser.id);

    return { success: true, user: newUser };
  }

  public async signIn(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    const trimmedEmail = email.trim().toLowerCase();
    const users = this.getUsers();
    const user = users.find((u) => u.email === trimmedEmail);

    if (!user) {
      return {
        success: false,
        error: 'No author ledger found with this email.',
      };
    }

    const inputHash = await hashPassword(password);
    if (user.passwordHash !== inputHash) {
      return {
        success: false,
        error: 'Incorrect credentials. Please verify your password.',
      };
    }

    localStorage.setItem(CURRENT_SESSION_KEY, user.id);
    return { success: true, user };
  }

  public signOut(): void {
    localStorage.removeItem(CURRENT_SESSION_KEY);
  }

  public updateUserProfile(
    userId: string,
    newName: string
  ): User | null {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return null;

    users[idx].name = newName.trim();
    users[idx].avatarLetter = newName.trim().charAt(0).toUpperCase() || 'W';
    this.saveUsers(users);
    return users[idx];
  }
}

export const authService = new AuthService();
