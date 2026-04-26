'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Activity, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function HealingPage() {
    const { data: deployments = [] } = useQuery({
        queryKey: ['deployments'],
        queryFn: () => api.get('/api/deployments').then((r) => r.data),
    });

    const { data: events = [], isLoading } = useQuery({
        queryKey: ['healing-events'],
        queryFn: async () => {
            const all = await Promise.all(
                deployments.map((d: any) =>
                    api.get(`/api/deployments/${d.id}/healing-events`)
                        .then((r) => r.data.map((e: any) => ({ ...e, deploymentName: d.name })))
                )
            );
            return all.flat().sort(
                (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        },
        enabled: deployments.length > 0,
        refetchInterval: 15000,
    });

    const statusIcon = (s: string) => ({
        RESOLVED: <CheckCircle size={14} className="text-green-400" />,
        FAILED: <XCircle size={14} className="text-red-400" />,
        IN_PROGRESS: <Clock size={14} className="text-yellow-400" />,
    }[s]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white">Healing Events</h2>
                <p className="text-gray-400 text-sm mt-1">Auto-remediation history across all deployments</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-800/50">
                        <tr className="text-gray-400">
                            <th className="text-left px-6 py-3 font-medium">Deployment</th>
                            <th className="text-left px-6 py-3 font-medium">Trigger</th>
                            <th className="text-left px-6 py-3 font-medium">Action</th>
                            <th className="text-left px-6 py-3 font-medium">Status</th>
                            <th className="text-left px-6 py-3 font-medium">Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {isLoading && (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
                        )}
                        {events.map((e: any) => (
                            <tr key={e.id} className="text-gray-300 hover:bg-gray-800/30 transition">
                                <td className="px-6 py-4 font-mono text-blue-400">{e.deploymentName}</td>
                                <td className="px-6 py-4">
                                    <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded text-xs">
                                        {e.trigger}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded text-xs">
                                        {e.action}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="flex items-center gap-1.5">
                                        {statusIcon(e.status)} {e.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-500 text-xs">
                                    {new Date(e.createdAt).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                        {!isLoading && events.length === 0 && (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No healing events yet</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}