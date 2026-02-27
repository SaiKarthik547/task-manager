import { useState, useEffect } from 'react';
import { rolesAPI } from '../../lib/api';
import Layout from '../../components/Layout';

export default function Roles() {
    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
                    {/* Placeholder for future implementation */}
                    <button className="btn btn-secondary opacity-50 cursor-not-allowed">
                        Coming Soon (System Roles Only)
                    </button>
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
                                <div className="text-sm text-primary-600 font-medium cursor-pointer hover:underline">
                                    View Assigned Permissions →
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Layout>
    );
}
