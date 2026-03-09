import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { projectsAPI } from '../lib/api';
import Layout from '../components/Layout';

export default function ProjectDetails() {
    const { id } = useParams<{ id: string }>();
    const [project, setProject] = useState<any>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        if (!id) return;
        try {
            const [projRes, tasksRes] = await Promise.all([
                projectsAPI.getById(parseInt(id)),
                projectsAPI.getTasks(parseInt(id))
            ]);
            setProject(projRes.data.project);
            setTasks(tasksRes.data.tasks);
        } catch (error) {
            console.error('Failed to load project', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-96">
                    <div className="spinner"></div>
                </div>
            </Layout>
        );
    }

    if (!project) return (
        <Layout>
            <div className="text-center py-20">Project not found</div>
        </Layout>
    );

    return (
        <Layout>
            <div className="space-y-8 animate-fade-in">
                {/* Header */}
                <div className="glass-card p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <span className={`badge ${project.priority === 'high' ? 'badge-danger' : 'badge-primary'}`}>
                                {project.priority} Priority
                            </span>
                            <span className="text-sm text-gray-500">
                                Created {new Date(project.created_at).toLocaleDateString()}
                            </span>
                        </div>
                        <h1 className="text-4xl font-bold text-gray-800 mb-2">{project.name}</h1>
                        <p className="text-lg text-gray-600 max-w-2xl">{project.description}</p>

                        <div className="mt-8 flex items-center space-x-6">
                            <div className="text-center">
                                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Status</p>
                                <span className="text-lg font-bold text-gray-800 capitalize">{project.status}</span>
                            </div>
                            <div className="h-8 w-px bg-gray-300"></div>
                            <div className="text-center">
                                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Tasks</p>
                                <span className="text-lg font-bold text-gray-800">{tasks.length}</span>
                            </div>
                            <div className="h-8 w-px bg-gray-300"></div>
                            <div className="text-center">
                                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Health</p>
                                <span className={`text-lg font-bold ${project.health_score > 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                                    {project.health_score}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tasks List */}
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Project Tasks</h2>
                        <button onClick={() => window.location.href = '/tasks'} className="btn btn-primary text-sm">Go to Tasks</button>
                    </div>
                    <div className="space-y-4">
                        {tasks.map((task, index) => (
                            <div key={task.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                                <div className="flex items-center space-x-4">
                                    <div className={`w-3 h-3 rounded-full ${task.status === 'completed' ? 'bg-green-500' :
                                        task.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-300'
                                        }`}></div>
                                    <div>
                                        <h4 className="font-semibold text-gray-800">{task.title}</h4>
                                        <p className="text-sm text-gray-500">{task.assigned_to_name ? `Assigned to ${task.assigned_to_name}` : 'Unassigned'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className="badge badge-secondary text-xs">{task.status.replace('_', ' ')}</span>
                                    {task.due_date && <span className="text-xs text-red-500 font-medium">Due {new Date(task.due_date).toLocaleDateString()}</span>}
                                </div>
                            </div>
                        ))}
                        {tasks.length === 0 && (
                            <p className="text-center py-8 text-gray-500">No tasks created yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
