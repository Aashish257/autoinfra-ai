import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
    headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
    (res) => res,
    async (err) => {
        const original = err.config;
        if (err.response?.status === 401 && !original._retry) {
            original._retry = true;
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                window.location.href = '/login';
                return Promise.reject(err);
            }
            try {
                const { data } = await axios.post(
                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/refresh`,
                    { refreshToken }
                );
                localStorage.setItem('accessToken', data.accessToken);
                Cookies.set('accessToken', data.accessToken, { expires: 7, secure: true, sameSite: 'strict' });
                
                original.headers.Authorization = `Bearer ${data.accessToken}`;
                return api(original);
            } catch {
                localStorage.clear();
                Cookies.remove('accessToken');
                Cookies.remove('refreshToken');
                window.location.href = '/login';
            }
        }
        return Promise.reject(err);
    }
);

export default api;