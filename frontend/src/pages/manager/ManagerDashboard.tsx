import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectsAPI, tasksAPI } from '../../lib/api';
import Layout from '../../components/Layout';

export default function ManagerDashboard() {
    const [projects, setProjects] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [projectsRes, tasksRes] = await Promise.all([
                projectsAPI.getAll(),
                tasksAPI.getAll(),
            ]);
            setProjects(projectsRes.data.projects);
            setTasks(tasksRes.data.tasks);
        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="spinner mx-auto mb-4"></div>
                        <p className="text-gray-600 font-medium">Loading projects...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    const tasksByStatus = {
        not_started: tasks.filter(t => t.status === 'not_started').length,
        in_progress: tasks.filter(t => t.status === 'in_progress').length,
        under_review: tasks.filter(t => t.status === 'under_review').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        blocked: tasks.filter(t => t.status === 'blocked').length,
    };

    const activeProjects = projects.filter(p => p.status === 'active').length;
    const completionRate = tasks.length > 0
        ? Math.round((tasksByStatus.completed / tasks.length) * 100)
        : 0;

    return (
        <Layout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between animate-slide-down">
                    <div>
                        <h1 className="text-4xl font-bold gradient-text">Project Command Center</h1>
                        <p className="text-gray-600 mt-2">Manage projects, track progress, and lead your team</p>
                    </div>
                    <button className="btn btn-primary">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Project
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="stat-card group animate-scale-in">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600 uppercase">Projects</p>
                                <p className="mt-2 text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                    {activeProjects}
                                </p>
                            </div>
                            <div className="text-4xl">🚀</div>
                        </div>
                    </div>

                    <div className="stat-card animate-scale-in animate-delay-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600 uppercase">In Progress</p>
                                <p className="mt-2 text-3xl font-bold text-blue-600">{tasksByStatus.in_progress}</p>
                            </div>
                            <div className="text-4xl">⚡</div>
                        </div>
                    </div>

                    <div className="stat-card animate-scale-in animate-delay-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600 uppercase">Completed</p>
                                <p className="mt-2 text-3xl font-bold text-green-600">{tasksByStatus.completed}</p>
                            </div>
                            <div className="text-4xl">✅</div>
                        </div>
                    </div>

                    <div className="stat-card animate-scale-in animate-delay-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600 uppercase">Blocked</p>
                                <p className="mt-2 text-3xl font-bold text-red-600">{tasksByStatus.blocked}</p>
                            </div>
                            <div className="text-4xl">🚫</div>
                        </div>
                    </div>

                    <div className="stat-card animate-scale-in animate-delay-400">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600 uppercase">Completion</p>
                                <p className="mt-2 text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                    {completionRate}%
                                </p>
                            </div>
                            <div className="text-4xl">📊</div>
                        </div>
                    </div>
                </div>

                {/* Active Projects */}
                <div className="glass-card p-6 animate-slide-up">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Active Projects</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.filter(p => p.status === 'active').map((project, index) => (
                            <div
                                key={project.id}
                                className="task-card group animate-scale-in"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="font-bold text-lg text-gray-800 group-hover:text-primary-600 transition">
                                        {project.name}
                                    </h3>
                                    <span className={`badge ${project.priority === 'high' ? 'badge-danger' :
                                        project.priority === 'medium' ? 'badge-warning' : 'badge-success'
                                        }`}>
                                        {project.priority}
                                    </span>
                                </div>

                                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description}</p>

                                {/* Health bar */}
                                <div className="mb-4">
                                    <div className="flex items-center justify-between text-sm mb-2">
                                        <span className="font-semibold text-gray-700">Project Health</span>
                                        <span className={`font-bold ${project.health_score >= 80 ? 'text-green-600' :
                                            project.health_score >= 50 ? 'text-yellow-600' : 'text-red-600'
                                            }`}>
                                            {project.health_score}%
                                        </span>
                                    </div>
                                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${project.health_score >= 80 ? 'bg-gradient-success' :
                                                project.health_score >= 50 ? 'bg-gradient-warning' : 'bg-gradient-danger'
                                                }`}
                                            style={{ width: `${project.health_score}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Timeline */}
                                {project.start_date && (
                                    <div className="flex items-center text-xs text-gray-500 space-x-2 mb-3">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span>{new Date(project.start_date).toLocaleDateString()}</span>
                                        <span>→</span>
                                        <span>{project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Ongoing'}</span>
                                    </div>
                                )}

                                <Link to={`/projects/${project.id}`} className="w-full btn btn-secondary text-sm py-2 hover:shadow-glow text-center block">
                                    View Details →
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Tasks */}
                <div className="glass-card p-6 animate-slide-up animate-delay-100">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Tasks</h2>
                    <div className="space-y-4">
                        {tasks.slice(0, 6).map((task, index) => (
                            <div
                                key={task.id}
                                className="flex items-center justify-between p-4 glass-card hover:shadow-glow transition-all animate-slide-up"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="flex-1 flex items-center space-x-4">
                                    <div className={`w-2 h-12 rounded-full ${task.priority === 'high' ? 'bg-gradient-danger' :
                                        task.priority === 'medium' ? 'bg-gradient-warning' : 'bg-gradient-success'
                                        }`}></div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-800">{task.title}</h4>
                                        <p className="text-sm text-gray-600 line-clamp-1">{task.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className={`badge ${task.status === 'completed' ? 'badge-success' :
                                        task.status === 'in_progress' ? 'badge-primary' :
                                            task.status === 'blocked' ? 'badge-danger' : 'badge-warning'
                                        }`}>
                                        {task.status.replace('_', ' ')}
                                    </span>
                                    <span className={`hidden sm:inline badge ${task.priority === 'high' ? 'badge-danger' :
                                        task.priority === 'medium' ? 'badge-warning' : 'badge-success'
                                        }`}>
                                        {task.priority}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
