import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Users, Search, Shield, Building2 } from 'lucide-react';
import { format } from 'date-fns';

export const UserManager: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await api.listAllUsers();
                setUsers(data);
            } catch (err) {
                console.error("Failed to load platform users", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'SUPERADMIN': return 'bg-purple-100 text-purple-800 border border-purple-200';
            case 'ADMIN': return 'bg-amber-100 text-amber-800 border border-amber-200';
            case 'DOCTOR': return 'bg-blue-100 text-blue-800 border border-blue-200';
            default: return 'bg-slate-100 text-slate-800 border border-slate-200';
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 leading-tight">Platform Users</h1>
                    <p className="text-slate-500 font-medium mt-1">Directory of all professionals across global tenants.</p>
                </div>

                <div className="relative">
                    <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search users..."
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
                                <th className="p-4 pl-6">Professional</th>
                                <th className="p-4">Role</th>
                                <th className="p-4">Specialty</th>
                                <th className="p-4">Tenant Access</th>
                                <th className="p-4">Joined Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">Loading platform directory...</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">No users found.</td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${user.role === 'SUPERADMIN' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                                                    {user.role === 'SUPERADMIN' ? <Shield className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">{user.name}</p>
                                                    <p className="text-xs text-slate-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${getRoleBadge(user.role)}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-sm font-medium text-slate-600">
                                                {user.specialty || user.position || '—'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {user.hospital_id ? (
                                                <span className="flex items-center gap-1.5 font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded w-fit">
                                                    <Building2 className="w-3 h-3" /> {user.hospital_id.substring(0, 8)}...
                                                </span>
                                            ) : (
                                                <span className="text-xs font-semibold text-purple-600">GLOBAL ACCESS</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm text-slate-500">
                                            {format(new Date(user.created_at), 'MMM d, yyyy')}
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
