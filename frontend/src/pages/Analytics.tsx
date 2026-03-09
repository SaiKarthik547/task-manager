import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { analyticsAPI } from '../lib/api';
import Layout from '../components/Layout';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

interface AnalyticsData {
    overview: {
        total_tasks: number,
        completed_tasks: number,
        overdue_tasks: number,
        completion_rate: number
    };
    health: any[];
    timeline: any[];
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6']; // Green, Yellow, Red, Purple

export default function AnalyticsDashboard() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalytics = async () => {
        setLoading(true);
        setError(null);
        try {
            const [overviewRes, healthRes, timelineRes] = await Promise.all([
                analyticsAPI.getOverview(),
                analyticsAPI.getProjectHealth(),
                analyticsAPI.getTasksTimeline()
            ]);

            setData({
                overview: overviewRes.data,
                health: healthRes.data.project_health,
                timeline: timelineRes.data.timeline
            });
        } catch (err: any) {
            console.error('Failed to load analytics', err);
            setError('Failed to load analytics data. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-64">
                    <div className="spinner border-primary-500 w-12 h-12 border-4"></div>
                </div>
            </Layout>
        );
    }

    if (error || !data) {
        return (
            <Layout>
                <div className="glass-card p-10 text-center">
                    <div className="text-red-500 text-4xl mb-4">⚠️</div>
                    <h3 className="text-xl font-bold mb-2">Something went wrong</h3>
                    <p className="text-gray-600 mb-6">{error || 'No data available'}</p>
                    <button onClick={fetchAnalytics} className="btn btn-primary">Retry</button>
                </div>
            </Layout>
        );
    }

    // Pie chart label customizer
    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        return percent > 0 ? (
            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fontWeight="bold">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        ) : null;
    };

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
                        <p className="text-gray-500 dark:text-gray-400">System overview and performance metrics</p>
                    </div>
                </div>

                {/* Overview Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="glass-card p-6 border-l-4 border-blue-500 hover:-translate-y-1 transition-transform">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Tasks</h3>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{data.overview.total_tasks}</p>
                    </div>
                    <div className="glass-card p-6 border-l-4 border-green-500 hover:-translate-y-1 transition-transform">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Completed</h3>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{data.overview.completed_tasks}</p>
                    </div>
                    <div className="glass-card p-6 border-l-4 border-red-500 hover:-translate-y-1 transition-transform">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Overdue</h3>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{data.overview.overdue_tasks}</p>
                    </div>
                    <div className="glass-card p-6 border-l-4 border-purple-500 hover:-translate-y-1 transition-transform">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Completion Rate</h3>
                        <div className="flex items-end mt-2">
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{data.overview.completion_rate}%</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Timeline Chart */}
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Task Completion Timeline</h3>
                        <div className="h-80">
                            {data.timeline.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={data.timeline} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                                        <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickMargin={10} />
                                        <YAxis stroke="#6b7280" fontSize={12} allowDecimals={false} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Legend />
                                        <Line type="monotone" dataKey="completed" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400">No completion data available yet.</div>
                            )}
                        </div>
                    </div>

                    {/* Project Health Pie Chart */}
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Project Health Distribution</h3>
                        <div className="h-80">
                            {data.health.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data.health.map(item => ({ ...item, name: item.name.charAt(0).toUpperCase() + item.name.slice(1) }))}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={renderCustomizedLabel}
                                            outerRadius={120}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {data.health.map((entry, index) => {
                                                // Map health strings strictly to colors
                                                let color = COLORS[3]; // default purple
                                                if (entry.name === 'green') color = COLORS[0];
                                                if (entry.name === 'yellow') color = COLORS[1];
                                                if (entry.name === 'red') color = COLORS[2];

                                                return <Cell key={`cell-${index}`} fill={color} stroke="rgba(255,255,255,0.2)" />;
                                            })}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400">No project data available yet.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
