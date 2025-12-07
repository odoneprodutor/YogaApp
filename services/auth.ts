import { User } from '../types';

// Chaves para o LocalStorage
const USERS_KEY = 'yogaflow_users';
const SESSION_KEY = 'yogaflow_session';

// Simula um delay de rede
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const authService = {
  // Login
  login: async (email: string, password: string): Promise<User> => {
    await delay(800); // Fake delay
    
    const usersStr = localStorage.getItem(USERS_KEY);
    const users = usersStr ? JSON.parse(usersStr) : [];
    
    const user = users.find((u: any) => u.email === email && u.password === password);
    
    if (!user) {
      throw new Error('Email ou senha inválidos.');
    }

    const sessionUser: User = { id: user.id, name: user.name, email: user.email };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    return sessionUser;
  },

  // Cadastro
  signup: async (name: string, email: string, password: string): Promise<User> => {
    await delay(1000); // Fake delay

    const usersStr = localStorage.getItem(USERS_KEY);
    const users = usersStr ? JSON.parse(usersStr) : [];

    if (users.some((u: any) => u.email === email)) {
      throw new Error('Este email já está cadastrado.');
    }

    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password // Em um app real, NUNCA salve senhas em texto puro :)
    };

    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    const sessionUser: User = { id: newUser.id, name: newUser.name, email: newUser.email };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    return sessionUser;
  },

  // Logout
  logout: async () => {
    localStorage.removeItem(SESSION_KEY);
  },

  // Verificar sessão atual ao recarregar página
  getCurrentUser: (): User | null => {
    const sessionStr = localStorage.getItem(SESSION_KEY);
    if (!sessionStr) return null;
    return JSON.parse(sessionStr);
  }
};