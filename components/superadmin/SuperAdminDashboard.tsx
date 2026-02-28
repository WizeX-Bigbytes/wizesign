import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Building2, Users, FileText, Activity, AlertCircle } from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await api.getSuperAdminStats();
                setStats(data);
            } catch (err: any) {
                console.error('Failed to load stats', err);
                setError('Failed to load platform statistics.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 text-red-700 p-4 border border-red-200 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="font-medium">{error}</p>
            </div>
        );
    }

    const StatCard = ({ title, value, icon: Icon, colorClass, subtitle }: any) => (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-start justify-between">
            <div>
                <p className="text-slate-500 font-medium text-sm mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
                {subtitle && <p className="text-xs text-slate-400 mt-2 font-medium">{subtitle}</p>}
            </div>
            <div className={`p-4 rounded-xl ${colorClass}`}>
                <Icon className="w-6 h-6" />
            </div>
        </div>
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 leading-tight">Platform Overview</h1>
                <p className="text-slate-500 font-medium mt-1">High-level metrics across all WizeSign instances.</p>
            </div>

            {/* Top Level KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Hospitals"
                    value={stats?.total_hospitals || 0}
                    subtitle={`${stats?.active_hospitals || 0} currently active`}
                    icon={Building2}
                    colorClass="bg-indigo-50 text-indigo-600"
                />
                <StatCard
                    title="Total Users"
                    value={stats?.total_users || 0}
                    subtitle="Platform-wide professionals"
                    icon={Users}
                    colorClass="bg-amber-50 text-amber-600"
                />
                <StatCard
                    title="Total Patients"
                    value={stats?.total_patients || 0}
                    subtitle="Registered unique patients"
                    icon={Activity}
                    colorClass="bg-emerald-50 text-emerald-600"
                />
                <StatCard
                    title="Total Documents"
                    value={stats?.total_documents || 0}
                    subtitle="Drafts, sent & completed"
                    icon={FileText}
                    colorClass="bg-blue-50 text-blue-600"
                />
            </div>

            {/* Detailed Document Insights */}
            <h2 className="text-lg font-bold text-slate-900 mb-4 px-1">Document Status Breakdown</h2>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {Object.entries(stats?.documents_by_status || {}).map(([key, count]) => (
                        <div key={key} className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-center">
                            <span className="block text-xl font-bold text-slate-800 mb-1">{Number(count)}</span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{key}</span>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};
