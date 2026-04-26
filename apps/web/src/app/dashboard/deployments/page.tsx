'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Plus, Play, Trash2, RefreshCw } from 'lucide-react';

export default function DeploymentsPage() {
    const qc = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        name: '', imageTag: '', environment: 'STAGING', replicas: 1,
    });

    const { data: deployments = [], isLoading } = useQuery({
        queryKey: ['deployments'],
        queryFn: () => api.get('/api/deployments').then((r) => r.data),
        refetchInterval: 10000,
    });

    const createMutation = useMutation({
        mutationFn: (data: typeof form) => api.post('/api/deployments', data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['deployments'] });
            setShowForm(false);
            setForm({ name: '', imageTag: '', environment: 'STAGING', replicas: 1 });
        },
    });

    const deployMutation = useMutation({
        mutationFn: (id: string) => api.post(`/api/deployments/${id}/deploy`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['deployments'] }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/api/deployments/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['deployments'] }),
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Deployments</h2>
                    <p className="text-gray-400 text-sm mt-1">Manage and monitor all deployments</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm transition"
                >
                    <Plus size={16} /> New Deployment
                </button>
            </div>

            {/* Create form */}
            {showForm && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <h3 className="text-white font-semibold mb-4">Create Deployment</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Name', key: 'name', type: 'text', placeholder: 'api-service' },
                            { label: 'Image Tag', key: 'imageTag', type: 'text', placeholder: 'nginx:latest' },
                        ].map(({ label, key, type, placeholder }) => (
                            <div key={key}>
                                <label className="block text-sm text-gray-400 mb-1">{label}</label>
                                <input
                                    type={type}
                                    placeholder={placeholder}
                                    value={(form as any)[key]}
                                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        ))}
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Environment</label>
                            <select
                                value={form.environment}
                                onChange={(e) => setForm({ ...form, environment: e.target.value })}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                            >
                                {['DEVELOPMENT', 'STAGING', 'PRODUCTION'].map((e) => (
                                    <option key={e}>{e}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Replicas</label>
                            <input
                                type="number" min={1} max={20}
                                value={form.replicas}
                                onChange={(e) => setForm({ ...form, replicas: parseInt(e.target.value) })}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={() => createMutation.mutate(form)}
                            disabled={createMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm transition"
                        >
                            {createMutation.isPending ? 'Creating...' : 'Create'}
                        </button>
                        <button
                            onClick={() => setShowForm(false)}
                            className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Deployments list */}
            <div className="space-y-3">
                {isLoading && <p className="text-gray-500 text-sm">Loading...</p>}
                {deployments.map((d: any) => (
                    <div key={d.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <span className="font-mono text-blue-400 font-medium">{d.name}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${statusClass(d.status)}`}>
                                    {d.status}
                                </span>
                                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                                    {d.environment}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500">
                                {d.imageTag} · {d.replicas} replica{d.replicas > 1 ? 's' : ''} · {d._count?.healingEvents ?? 0} healing events
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => deployMutation.mutate(d.id)}
                                className="flex items-center gap-1.5 text-xs bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-600/30 px-3 py-1.5 rounded-lg transition"
                            >
                                <Play size={12} /> Deploy
                            </button>
                            <button
                                onClick={() => deployMutation.mutate(d.id)}
                                className="flex items-center gap-1.5 text-xs bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-600/30 px-3 py-1.5 rounded-lg transition"
                            >
                                <RefreshCw size={12} /> Heal Check
                            </button>
                            <button
                                onClick={() => deleteMutation.mutate(d.id)}
                                className="flex items-center gap-1.5 text-xs bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30 px-3 py-1.5 rounded-lg transition"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function statusClass(status: string) {
    const map: Record<string, string> = {
        RUNNING: 'bg-green-500/10 text-green-400 border-green-500/20',
        PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        HEALING: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        FAILED: 'bg-red-500/10 text-red-400 border-red-500/20',
        ROLLED_BACK: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    };
    return map[status] ?? '';
}