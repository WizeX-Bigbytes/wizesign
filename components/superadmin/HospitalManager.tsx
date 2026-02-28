import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Building2, Search, Settings } from 'lucide-react';
import { format } from 'date-fns';

export const HospitalManager: React.FC = () => {
    const [hospitals, setHospitals] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchHospitals = async () => {
            try {
                const data = await api.listAllHospitals();
                setHospitals(data);
            } catch (err) {
                console.error("Failed to load hospitals", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHospitals();
    }, []);

    const filteredHospitals = hospitals.filter(h =>
        h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.id.includes(searchTerm)
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 leading-tight">Tenant Hospitals</h1>
                    <p className="text-slate-500 font-medium mt-1">Manage all clinics and hospitals on WizeSign.</p>
                </div>

                <div className="relative">
                    <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search hospitals..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2.5 w-full sm:w-80 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                                <th className="p-4 pl-6">Hospital Name</th>
                                <th className="p-4">Tenant ID</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">WizeChat Integration</th>
                                <th className="p-4 text-right pr-6">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">Loading hospitals...</td>
                                </tr>
                            ) : filteredHospitals.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">No hospitals found.</td>
                                </tr>
                            ) : (
                                filteredHospitals.map((hospital) => (
                                    <tr key={hospital.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                                    <Building2 className="w-5 h-5" />
                                                </div>
                                                <span className="font-semibold text-slate-900">{hospital.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{hospital.id.substring(0, 13)}...</span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${hospital.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                                                }`}>
                                                {hospital.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {hospital.wizechat_config?.api_key ? (
                                                <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> Active
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-400 font-medium">Not Configured</span>
                                            )}
                                        </td>
                                        <td className="p-4 pr-6 text-right">
                                            <button
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Manage Tenant"
                                                onClick={() => alert('Tenant settings coming soon')}
                                            >
                                                <Settings className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
