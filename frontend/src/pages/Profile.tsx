import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../lib/api';
import Layout from '../components/Layout';

export default function Profile() {
    const { user } = useAuth();
    const [emailEnabled, setEmailEnabled] = useState(true);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            setMessage({ text: 'Password must be at least 6 characters', type: 'error' });
            return;
        }

        setIsSubmitting(true);
        setMessage({ text: '', type: '' });

        try {
            if (!user) return;
            await usersAPI.update(user.id, { password: newPassword });
            setMessage({ text: 'Password updated successfully!', type: 'success' });
            setTimeout(() => {
                setShowPasswordModal(false);
                setNewPassword('');
                setMessage({ text: '', type: '' });
            }, 2000);
        } catch (error) {
            setMessage({ text: 'Failed to update password', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

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
                            <button
                                onClick={() => setShowPasswordModal(true)}
                                className="btn btn-secondary w-full text-left flex justify-between items-center"
                            >
                                <span>••••••••••••</span>
                                <span className="text-xs text-primary-600 font-semibold">Change Password</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Preferences</h2>
                    <div className="flex items-center justify-between py-3">
                        <span className="text-gray-700">Email Notifications</span>
                        <div
                            onClick={() => setEmailEnabled(!emailEnabled)}
                            className={`relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer ${emailEnabled ? 'bg-primary-500' : 'bg-gray-200'}`}
                        >
                            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${emailEnabled ? 'left-7' : 'left-1'}`}></span>
                        </div>
                    </div>
                </div>

                {/* Password Change Modal */}
                {showPasswordModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in p-4">
                        <div className="glass-card p-8 max-w-md w-full animate-scale-in">
                            <h2 className="text-xl font-bold mb-4 gradient-text">Change Password</h2>

                            {message.text && (
                                <div className={`p-3 mb-4 rounded-lg text-sm ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
                                    {message.text}
                                </div>
                            )}

                            <form onSubmit={handlePasswordChange}>
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-gray-600 mb-1">New Password</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="input"
                                        required
                                        minLength={6}
                                        placeholder="Enter new password"
                                    />
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowPasswordModal(false);
                                            setMessage({ text: '', type: '' });
                                        }}
                                        className="btn btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="btn btn-primary"
                                    >
                                        {isSubmitting ? 'Updating...' : 'Update Password'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
