import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function Profile() {
    const { user } = useAuth();
    // Logic for updating password/email would go here

    return (
        <Layout>
            <div className="max-w-2xl mx-auto space-y-8 animate-scale-in">
                <div className="glass-card p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-cosmic opacity-80"></div>
                    <div className="relative pt-16">
                        <div className="w-32 h-32 mx-auto rounded-full border-4 border-white shadow-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-4xl text-white font-bold mb-4">
                            {user?.fullName.charAt(0)}
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800">{user?.fullName}</h1>
                        <p className="text-gray-600">@{user?.username}</p>
                        <div className="mt-4 inline-flex gap-2">
                            {user?.roleIds.map((roleId: number) => (
                                <span key={roleId} className="badge badge-primary">
                                    {roleId === 1 ? 'Admin' : roleId === 2 ? 'Manager' : 'Employee'}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="glass-card p-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Account Details</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1">Email Address</label>
                            <input
                                type="text"
                                value={user?.email}
                                disabled
                                className="input bg-gray-50 text-gray-500 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1">Password</label>
                            <button className="btn btn-secondary w-full text-left flex justify-between items-center">
                                <span>••••••••••••</span>
                                <span className="text-xs text-primary-600 font-semibold">Change Password</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Preferences</h2>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <span className="text-gray-700">Email Notifications</span>
                        <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out bg-gray-200 rounded-full cursor-pointer">
                            <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between py-3">
                        <span className="text-gray-700">Dark Mode</span>
                        <span className="text-xs text-gray-500">Coming soon</span>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
