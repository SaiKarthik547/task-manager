import { useState, useEffect } from 'react';
import { tasksAPI } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';

export default function EmployeeDashboard() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState<any>(null);

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        try {
            const response = await tasksAPI.getAll();
            const myTasks = response.data.tasks.filter((t: any) => t.assigned_to === user?.id);
            setTasks(myTasks);
        } catch (error) {
            console.error('Failed to load tasks', error);
        } finally {
            setLoading(false);
        }
    };

    const updateTaskStatus = async (taskId: number, status: string) => {
        try {
            await tasksAPI.update(taskId, { status });
            await loadTasks();
        } catch (error) {
            console.error('Failed to update task', error);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="spinner mx-auto mb-4"></div>
                        <p className="text-gray-600 font-medium">Loading your tasks...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    const tasksByStatus = {
        not_started: tasks.filter(t => t.status === 'not_started'),
        in_progress: tasks.filter(t => t.status === 'in_progress'),
        under_review: tasks.filter(t => t.status === 'under_review'),
        completed: tasks.filter(t => t.status === 'completed'),
    };

    const completionRate = tasks.length > 0
        ? Math.round((tasksByStatus.completed.length / tasks.length) * 100)
        : 0;

    return (
        <Layout>
            <div className="space-y-8">
                {/* Welcome Header */}
                <div className="glass-card p-8 bg-gradient-cosmic text-white animate-slide-down">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.fullName}! 👋</h1>
                            <p className="text-white/80 text-lg">Let's make today productive!</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-white/60 uppercase tracking-wide">Your Progress</p>
                            <p className="text-5xl font-bold">{completionRate}%</p>
                        </div>
                    </div>
                    <div className="mt-6 flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-white animate-pulse"></div>
                            <span>{tasks.length} Total Tasks</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-green-300 animate-pulse"></div>
                            <span>{tasksByStatus.completed.length} Completed</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-blue-300 animate-pulse"></div>
                            <span>{tasksByStatus.in_progress.length} In Progress</span>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
                    {[
                        { title: 'To Do', count: tasksByStatus.not_started.length, color: 'from-gray-400 to-slate-500', icon: '📋' },
                        { title: 'In Progress', count: tasksByStatus.in_progress.length, color: 'from-blue-400 to-indigo-500', icon: '⚡' },
                        { title: 'Under Review', count: tasksByStatus.under_review.length, color: 'from-yellow-400 to-orange-500', icon: '👀' },
                        { title: 'Completed', count: tasksByStatus.completed.length, color: 'from-green-400 to-emerald-500', icon: '✅' },
                    ].map((stat, index) => (
                        <div
                            key={stat.title}
                            className="stat-card group animate-scale-in"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-gray-600 uppercase">{stat.title}</p>
                                    <p className={`mt-2 text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                                        {stat.count}
                                    </p>
                                </div>
                                <div className="text-5xl">{stat.icon}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Kanban Board */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {Object.entries(tasksByStatus).map(([status, statusTasks], columnIndex) => (
                        <div key={status} className={`kanban-column animate-slide-up animate-delay-${columnIndex * 100}`}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-lg text-gray-800 capitalize flex items-center">
                                    <div className={`w-3 h-3 rounded-full mr-2 ${status === 'not_started' ? 'bg-gray-400' :
                                        status === 'in_progress' ? 'bg-blue-500' :
                                            status === 'under_review' ? 'bg-yellow-500' : 'bg-green-500'
                                        }`}></div>
                                    {status.replace('_', ' ')}
                                </h3>
                                <span className="badge badge-primary text-xs">{statusTasks.length}</span>
                            </div>

                            <div className="space-y-4">
                                {statusTasks.map((task: any, index: number) => (
                                    <div
                                        key={task.id}
                                        className="task-card animate-scale-in cursor-pointer"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                        onClick={() => setSelectedTask(task)}
                                    >
                                        {/* Priority indicator */}
                                        <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${task.priority === 'high' ? 'bg-gradient-danger' :
                                            task.priority === 'medium' ? 'bg-gradient-warning' : 'bg-gradient-success'
                                            }`}></div>

                                        <div className="pt-2">
                                            <h4 className="font-bold text-gray-800 mb-2 line-clamp-2">{task.title}</h4>
                                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>

                                            {/* Tags */}
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                <span className={`badge ${task.priority === 'high' ? 'badge-danger' :
                                                    task.priority === 'medium' ? 'badge-warning' : 'badge-success'
                                                    } text-xs`}>
                                                    {task.priority}
                                                </span>
                                                {task.project_id && (
                                                    <span className="badge badge-purple text-xs">Project #{task.project_id}</span>
                                                )}
                                            </div>

                                            {/* Due date */}
                                            {task.due_date && (
                                                <div className="flex items-center text-xs text-gray-500 mb-3">
                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    Due: {new Date(task.due_date).toLocaleDateString()}
                                                </div>
                                            )}

                                            {/* Action buttons */}
                                            <div className="flex gap-2 mt-4">
                                                {status === 'not_started' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            updateTaskStatus(task.id, 'in_progress');
                                                        }}
                                                        className="flex-1 btn btn-primary text-xs py-2"
                                                    >
                                                        <span className="flex items-center justify-center">
                                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            Start
                                                        </span>
                                                    </button>
                                                )}
                                                {status === 'in_progress' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            updateTaskStatus(task.id, 'under_review');
                                                        }}
                                                        className="flex-1 btn btn-success text-xs py-2"
                                                    >
                                                        <span className="flex items-center justify-center">
                                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            Submit
                                                        </span>
                                                    </button>
                                                )}
                                                {status === 'under_review' && (
                                                    <div className="text-center text-xs text-yellow-600 font-semibold py-2">
                                                        ⏳ Awaiting approval
                                                    </div>
                                                )}
                                                {status === 'completed' && (
                                                    <div className="text-center text-xs text-green-600 font-semibold py-2">
                                                        🎉 Completed!
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {statusTasks.length === 0 && (
                                    <div className="text-center py-12 text-gray-400">
                                        <svg className="w-16 h-16 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className="text-sm font-medium">No tasks here</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Task Detail Modal */}
                {selectedTask && (
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
                        onClick={() => setSelectedTask(null)}
                    >
                        <div
                            className="glass-card max-w-2xl w-full p-8 animate-scale-in"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-start justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-800">{selectedTask.title}</h2>
                                <button
                                    onClick={() => setSelectedTask(null)}
                                    className="p-2 hover:bg-red-50 rounded-lg transition"
                                >
                                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <p className="text-gray-600 mb-6">{selectedTask.description}</p>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Status</p>
                                    <span className={`badge ${selectedTask.status === 'completed' ? 'badge-success' :
                                        selectedTask.status === 'in_progress' ? 'badge-primary' :
                                            selectedTask.status === 'under_review' ? 'badge-warning' : 'badge-danger'
                                        }`}>
                                        {selectedTask.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Priority</p>
                                    <span className={`badge ${selectedTask.priority === 'high' ? 'badge-danger' :
                                        selectedTask.priority === 'medium' ? 'badge-warning' : 'badge-success'
                                        }`}>
                                        {selectedTask.priority}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedTask(null)}
                                className="btn btn-primary w-full"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
