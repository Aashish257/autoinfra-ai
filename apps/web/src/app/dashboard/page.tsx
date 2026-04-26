'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Rocket, Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function OverviewPage() {
    const { data: deployments = [] } = useQuery({
        queryKey: ['deployments'],
        queryFn: () => api.get('/api/deployments').then((r) => r.data),
        refetchInterval: 15000,
    });

    const stats = {
        total: deployments.length,
        running: deployments.filter((d: any) => d.status === 'RUNNING').length,
        healing: deployments.filter((d: any) => d.status === 'HEALING').length,
        failed: deployments.filter((d: any) => d.status === 'FAILED').length,
    };

    const STAT_CARDS = [
        { label: 'Total Deployments', value: stats.total, icon: Rocket, color: 'text-blue-400' },
        { label: 'Running', value: stats.running, icon: CheckCircle, color: 'text-green-400' },
        { label: 'Self-Healing', value: stats.healing, icon: Activity, color: 'text-yellow-400' },
        { label: 'Failed', value: stats.failed, icon: AlertTriangle, color: 'text-red-400' },
    ];

    // Mock chart data — replace with real metrics in production
    const chartData = Array.from({ length: 12 }, (_, i) => ({
        time: `${i * 5}m`,
        cpu: Math.floor(Math.random() * 60) + 20,
        mem: Math.floor(Math.random() * 50) + 30,
    }));

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-white">Overview</h2>
                <p className="text-gray-400 text-sm mt-1">Platform health at a glance</p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-4">
                {STAT_CARDS.map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-gray-400 text-sm">{label}</span>
                            <Icon size={18} className={color} />
                        </div>
                        <p className="text-3xl font-bold text-white">{value}</p>
                    </div>
                ))}
            </div>

            {/* Chart */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-6">Cluster Resource Usage</h3>
                <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="cpu" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="mem" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="time" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                        <YAxis stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 12 }} unit="%" />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                            labelStyle={{ color: '#9ca3af' }}
                        />
                        <Area type="monotone" dataKey="cpu" stroke="#3b82f6" fill="url(#cpu)" name="CPU" />
                        <Area type="monotone" dataKey="mem" stroke="#8b5cf6" fill="url(#mem)" name="Memory" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Recent deployments table */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4">Recent Deployments</h3>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-gray-500 border-b border-gray-800">
                            <th className="text-left pb-3 font-medium">Name</th>
                            <th className="text-left pb-3 font-medium">Environment</th>
                            <th className="text-left pb-3 font-medium">Image</th>
                            <th className="text-left pb-3 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {deployments.slice(0, 5).map((d: any) => (
                            <tr key={d.id} className="text-gray-300">
                                <td className="py-3 font-mono text-blue-400">{d.name}</td>
                                <td className="py-3">{d.environment}</td>
                                <td className="py-3 font-mono text-xs text-gray-400">{d.imageTag}</td>
                                <td className="py-3">
                                    <StatusBadge status={d.status} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        RUNNING: 'bg-green-500/10 text-green-400 border-green-500/20',
        PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        HEALING: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        FAILED: 'bg-red-500/10 text-red-400 border-red-500/20',
        ROLLED_BACK: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    };
    return (
        <span className={`text-xs px-2 py-1 rounded-full border ${map[status] ?? ''}`}>
            {status}
        </span>
    );
}