import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await attemptLogin(username, password);
    };

    const attemptLogin = async (user: string, pass: string) => {
        setError('');
        setLoading(true);
        try {
            await login(user, pass);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleDemoLogin = (user: string, pass: string) => {
        setUsername(user);
        setPassword(pass);
        attemptLogin(user, pass);
    };

    return (
        <div className="min-h-screen bg-gradient-cosmic flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-float"></div>
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-float animate-delay-200"></div>
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-float animate-delay-400"></div>
            </div>

            <div className="relative z-10 w-full max-w-md animate-scale-in">
                {/* Glass card */}
                <div className="glass-card p-8 md:p-10">
                    {/* Logo and title */}
                    <div className="text-center mb-8">
                        <div className="inline-block p-4 bg-gradient-primary rounded-2xl shadow-glow mb-4">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        </div>
                        <h1 className="text-4xl font-bold gradient-text mb-2">Task Manager Pro</h1>
                        <p className="text-gray-600 font-medium">Enterprise Task Management Platform</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-gradient-danger/10 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl animate-slide-down backdrop-blur-sm">
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <span className="font-medium">{error}</span>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="input"
                                placeholder="Enter your username"
                                required
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input"
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full text-lg shadow-glow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <span className="spinner mr-3"></span>
                                    Signing in...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                    </svg>
                                    Sign In
                                </span>
                            )}
                        </button>
                    </form>

                    {/* Demo credentials */}
                    <div className="mt-8 glass-card p-5 border-2 border-primary-200">
                        <div className="flex items-start">
                            <svg className="w-6 h-6 text-primary-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-primary-900 mb-2">1-Click Demo Login</p>
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-xs font-semibold text-purple-800 uppercase tracking-wider mb-1 block">Admins</span>
                                        <div className="flex flex-wrap gap-2">
                                            {['admin', 'admin2'].map(u => (
                                                <button key={u} type="button" onClick={() => handleDemoLogin(u, 'Admin@123')}
                                                    className="px-3 py-1 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-full text-xs font-medium transition cursor-pointer border border-purple-200 shadow-sm">
                                                    {u}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider mb-1 block">Managers</span>
                                        <div className="flex flex-wrap gap-2">
                                            {['manager1', 'manager2', 'manager3'].map(u => (
                                                <button key={u} type="button" onClick={() => handleDemoLogin(u, 'Manager@123')}
                                                    className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-full text-xs font-medium transition cursor-pointer border border-blue-200 shadow-sm">
                                                    {u}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-xs font-semibold text-green-800 uppercase tracking-wider mb-1 block">Employees</span>
                                        <div className="flex flex-wrap gap-2">
                                            {['employee1', 'employee2', 'emp2', 'emp3', 'emp4', 'emp5'].map(u => (
                                                <button key={u} type="button" onClick={() => handleDemoLogin(u, 'Employee@123')}
                                                    className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-full text-xs font-medium transition cursor-pointer border border-green-200 shadow-sm">
                                                    {u}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center mt-6 text-white/80 text-sm font-medium">
                    Powered by Enterprise Task Management 2.0
                </p>
            </div>
        </div>
    );
}
