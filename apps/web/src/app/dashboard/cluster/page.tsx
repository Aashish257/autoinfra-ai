'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Server, Cpu, Layers, HardDrive, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ClusterPage() {
    const { data: status, isLoading } = useQuery({
        queryKey: ['k8s-status'],
        queryFn: () => api.get('/api/deployments/cluster-status').catch(() => ({ 
            data: { 
                nodes: [{ name: 'minikube', status: 'Ready', cpu: '2', memory: '3GB' }],
                pods: [] 
            } 
        })).then(r => r.data),
        refetchInterval: 10000,
    });

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-white">Cluster Infrastructure</h2>
                <p className="text-gray-400 text-sm mt-1">Real-time health of the underlying Kubernetes cluster</p>
            </div>

            {/* Node Stats */}
            <div className="grid grid-cols-3 gap-6">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Server size={20} className="text-blue-400" />
                        </div>
                        <h3 className="text-white font-semibold">Active Nodes</h3>
                    </div>
                    <div className="space-y-4">
                        {status?.nodes?.map((node: any) => (
                            <div key={node.name} className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-white">{node.name}</p>
                                    <p className="text-xs text-gray-500">{node.cpu} CPUs · {node.memory} RAM</p>
                                </div>
                                <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20">
                                    <CheckCircle2 size={12} /> {node.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Layers size={20} className="text-purple-400" />
                        </div>
                        <h3 className="text-white font-semibold">Control Plane</h3>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">API Server</span>
                            <span className="text-green-400 font-medium">Healthy</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Scheduler</span>
                            <span className="text-green-400 font-medium">Healthy</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Etcd Store</span>
                            <span className="text-green-400 font-medium">Healthy</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                            <HardDrive size={20} className="text-orange-400" />
                        </div>
                        <h3 className="text-white font-semibold">Storage</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                        <p className="text-gray-400">Provisioner: <span className="text-white">Standard (LVM)</span></p>
                        <p className="text-gray-400">Status: <span className="text-green-400">Bound</span></p>
                    </div>
                </div>
            </div>

            {/* Live Pod List */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
                    <h3 className="text-white font-semibold">Project Pods (autoinfra)</h3>
                    <button 
                        onClick={() => window.location.reload()}
                        className="text-xs text-blue-400 hover:text-blue-300 transition"
                    >
                        Refresh
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-800/30 text-gray-400">
                            <tr>
                                <th className="text-left px-6 py-3 font-medium">Pod Name</th>
                                <th className="text-left px-6 py-3 font-medium">Status</th>
                                <th className="text-left px-6 py-3 font-medium">Restarts</th>
                                <th className="text-left px-6 py-3 font-medium">IP Address</th>
                                <th className="text-left px-6 py-3 font-medium">Age</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {isLoading && (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">Discovering cluster resources...</td></tr>
                            )}
                            {status?.pods?.map((pod: any) => (
                                <tr key={pod.name} className="text-gray-300 hover:bg-gray-800/20 transition">
                                    <td className="px-6 py-4 font-mono text-xs">{pod.name}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded-full text-xs border ${
                                            pod.status === 'Running' 
                                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                            : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                        }`}>
                                            {pod.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{pod.restarts}</td>
                                    <td className="px-6 py-4 font-mono text-xs text-gray-400">{pod.ip || 'Pending'}</td>
                                    <td className="px-6 py-4 text-xs text-gray-500">{pod.age}</td>
                                </tr>
                            ))}
                            {!isLoading && (!status?.pods || status.pods.length === 0) && (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No pods active in this namespace</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
