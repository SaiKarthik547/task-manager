import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersAPI, rolesAPI } from '../../lib/api';
import Layout from '../../components/Layout';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [users, setUsers] = useState<any[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [roles, setRoles] = useState<any[]>([]);
    const [permissions, setPermissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [usersRes, rolesRes, permsRes] = await Promise.all([
                usersAPI.getAll(),
                rolesAPI.getAll(),
                rolesAPI.getPermissions(),
            ]);
            setUsers(usersRes.data.users);
            setFilteredUsers(usersRes.data.users);
            setRoles(rolesRes.data.roles);
            setPermissions(permsRes.data.permissions);
        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);
        const filtered = users.filter(u =>
            u.full_name.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query) ||
            u.username.toLowerCase().includes(query)
        );
        setFilteredUsers(filtered);
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="spinner mx-auto mb-4"></div>
                        <p className="text-gray-600 font-medium">Loading dashboard...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    const activeUsers = users.filter(u => u.is_active === 1).length;
    const inactiveUsers = users.filter(u => u.is_active === 0).length;

    return (
        <Layout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between animate-slide-down">
                    <div>
                        <h1 className="text-4xl font-bold gradient-text">Admin Control Center</h1>
                        <p className="text-gray-600 mt-2">Manage users, roles, and system permissions</p>
                    </div>
                    <button onClick={() => navigate('/admin/users')} className="btn btn-primary">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add User
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="stat-card group animate-scale-in">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Users</p>
                                <p className="mt-2 text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    {users.length}
                                </p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl shadow-lg">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm">
                            <span className="text-green-600 font-semibold">{activeUsers} active</span>
                            <span className="text-gray-400 mx-2">•</span>
                            <span className="text-red-600">{inactiveUsers} inactive</span>
                        </div>
                    </div>

                    <div className="stat-card animate-scale-in animate-delay-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">System Roles</p>
                                <p className="mt-2 text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                    {roles.length}
                                </p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl shadow-lg">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.040A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                        </div>
                        <div className="mt-4 text-sm text-gray-600">
                            {roles.filter(r => r.is_system_role === 1).length} system protected
                        </div>
                    </div>

                    <div className="stat-card animate-scale-in animate-delay-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Permissions</p>
                                <p className="mt-2 text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                    {permissions.length}
                                </p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl shadow-lg">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                        </div>
                        <div className="mt-4 text-sm text-gray-600">
                            Granular access control
                        </div>
                    </div>

                    <div className="stat-card animate-scale-in animate-delay-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">System Health</p>
                                <p className="mt-2 text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                                    98%
                                </p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl shadow-lg">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                        </div>
                        <div className="mt-4 text-sm text-green-600 font-semibold">All systems operational</div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="glass-card p-6 animate-slide-up">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
                        <div className="flex items-center space-x-3">
                            <input
                                type="text"
                                placeholder="Search users by name or email..."
                                value={searchQuery}
                                onChange={handleSearch}
                                className="input py-2 text-sm w-64"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto scrollbar-thin">
                        <table className="min-w-full">
                            <thead>
                                <tr className="table-header">
                                    <th className="px-6 py-4 text-left">User</th>
                                    <th className="px-6 py-4 text-left">Email</th>
                                    <th className="px-6 py-4 text-left">Roles</th>
                                    <th className="px-6 py-4 text-left">Status</th>
                                    <th className="px-6 py-4 text-left">Last Login</th>
                                    <th className="px-6 py-4 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredUsers.map((user, index) => (
                                    <tr key={user.id} className="table-row" style={{ animationDelay: `${index * 50}ms` }}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold shadow-md">
                                                    {user.full_name.charAt(0)}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-semibold text-gray-900">{user.full_name}</div>
                                                    <div className="text-xs text-gray-500">@{user.username}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-2">
                                                {user.roles?.map((role: any) => (
                                                    <span key={role.id} className="badge badge-primary">
                                                        {role.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'}`}>
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button onClick={() => navigate('/admin/users')} className="btn btn-secondary text-xs py-1 px-3">
                                                Manage User
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Roles Grid */}
                <div className="glass-card p-6 animate-slide-up animate-delay-100">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Role Configuration</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {roles.map((role, index) => (
                            <div
                                key={role.id}
                                className="task-card animate-scale-in"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="text-lg font-bold text-gray-800">{role.name}</h3>
                                    {role.is_system_role === 1 && (
                                        <span className="badge badge-warning text-xs">Protected</span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600 mb-4">{role.description}</p>
                                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                                    <span className="text-xs text-gray-500">Created {new Date(role.created_at).toLocaleDateString()}</span>
                                    <button onClick={() => navigate('/admin/roles')} className="text-primary-600 hover:text-primary-700 text-sm font-semibold">
                                        View Permissions →
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
