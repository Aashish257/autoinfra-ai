'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { LayoutDashboard, Rocket, Activity, LogOut, Server } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Deployments', href: '/dashboard/deployments', icon: Rocket },
    { label: 'Healing', href: '/dashboard/healing', icon: Activity },
    { label: 'Cluster', href: '/dashboard/cluster', icon: Server },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, clearAuth } = useAuthStore();

    function logout() {
        clearAuth();
        router.push('/login');
    }

    return (
        <div className="flex h-screen bg-gray-950">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
                <div className="p-6 border-b border-gray-800">
                    <h1 className="text-lg font-bold text-white">AutoInfra AI</h1>
                    <p className="text-xs text-gray-500 mt-0.5">Self-Healing Platform</p>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {NAV.map(({ label, href, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition',
                                pathname === href
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            )}
                        >
                            <Icon size={16} />
                            {label}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <div className="mb-3 px-3">
                        <p className="text-sm text-white font-medium">{user?.email}</p>
                        <p className="text-xs text-gray-500">{user?.role}</p>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 px-3 py-2 transition w-full"
                    >
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 overflow-auto p-8">{children}</main>
        </div>
    );
}