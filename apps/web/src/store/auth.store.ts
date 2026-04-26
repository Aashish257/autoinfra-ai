import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';

interface User {
    id: string;
    email: string;
    role: string;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    setAuth: (user: User, accessToken: string, refreshToken: string) => void;
    clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            setAuth: (user, accessToken, refreshToken) => {
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);
                
                // Set cookies for middleware
                Cookies.set('accessToken', accessToken, { expires: 7, secure: true, sameSite: 'strict' });
                Cookies.set('refreshToken', refreshToken, { expires: 30, secure: true, sameSite: 'strict' });
                
                set({ user, accessToken, refreshToken });
            },
            clearAuth: () => {
                localStorage.clear();
                Cookies.remove('accessToken');
                Cookies.remove('refreshToken');
                set({ user: null, accessToken: null, refreshToken: null });
            },
        }),
        { name: 'auth-storage' }
    )
);