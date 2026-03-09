import { useState, useEffect } from 'react';
import { rolesAPI } from '../../lib/api';
import Layout from '../../components/Layout';

export default function Roles() {
    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedRole, setExpandedRole] = useState<number | null>(null);
    const [rolePermissions, setRolePermissions] = useState<any[]>([]);
    const [loadingPermissions, setLoadingPermissions] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await rolesAPI.getAll();
            setRoles(res.data.roles);
        } catch (error) {
            console.error('Failed to load roles', error);
        } finally {
            setLoading(false);
        }
    };

    const togglePermissions = async (roleId: number) => {
        if (expandedRole === roleId) {
            setExpandedRole(null);
            return;
        }

        setExpandedRole(roleId);
        setLoadingPermissions(true);
        try {
            const res = await rolesAPI.getRolePermissions(roleId);
            setRolePermissions(res.data.permissions || []);
        } catch (error) {
            console.error('Failed to load permissions', error);
            setRolePermissions([]);
        } finally {
            setLoadingPermissions(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-full">
                    <div className="spinner"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Role Management</h1>
                        <p className="text-gray-600">Configure system access levels</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {roles.map((role, index) => (
                        <div
                            key={role.id}
                            className="glass-card p-6 animate-scale-in"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-gray-800">{role.name}</h3>
                                {role.is_system_role === 1 && (
                                    <span className="badge badge-warning">System</span>
                                )}
                            </div>
                            <p className="text-gray-600 mb-6">{role.description}</p>

                            <div className="border-t border-gray-100 pt-4">
                                <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Permissions</p>
                                <div
                                    className="text-sm text-primary-600 font-medium cursor-pointer hover:underline mb-3"
                                    onClick={() => togglePermissions(role.id)}
                                >
                                    {expandedRole === role.id ? 'Hide Permissions ↑' : 'View Assigned Permissions ↓'}
                                </div>

                                {expandedRole === role.id && (
                                    <div className="bg-gray-50 rounded-lg p-3 mt-2 animate-fade-in text-sm">
                                        {loadingPermissions ? (
                                            <div className="text-gray-500 text-center py-2">Loading...</div>
                                        ) : rolePermissions.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {rolePermissions.map((perm) => (
                                                    <span key={perm.id} className="badge badge-purple text-xs">
                                                        {perm.name}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-gray-500 text-xs italic">No permissions assigned.</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Layout>
    );
}
