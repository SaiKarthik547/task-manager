import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectsAPI } from '../lib/api';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

export default function Projects() {
    const { user } = useAuth();
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        priority: 'medium',
        status: 'active',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            const res = await projectsAPI.getAll();
            setProjects(res.data.projects);
        } catch (error) {
            console.error('Failed to load projects', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await projectsAPI.create({
                ...formData,
                start_date: formData.startDate,
                end_date: formData.endDate
            });
            setShowCreateModal(false);
            setFormData({
                name: '',
                description: '',
                priority: 'medium',
                status: 'active',
                startDate: '',
                endDate: ''
            });
            loadProjects();
        } catch (error) {
            console.error('Failed to create project', error);
        }
    };

    const canCreateProject = user?.roleIds.includes(1) || user?.roleIds.includes(2);

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
                        <h1 className="text-3xl font-bold text-gray-800">Projects</h1>
                        <p className="text-gray-600">Overview of all ongoing initiatives</p>
                    </div>
                    {canCreateProject && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="btn btn-primary"
                        >
                            + New Project
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project, index) => (
                        <div
                            key={project.id}
                            className="task-card group animate-scale-in"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-xl text-gray-800 group-hover:text-primary-600 transition">
                                    {project.name}
                                </h3>
                                <span className={`badge ${project.status === 'active' ? 'badge-success' :
                                    project.status === 'completed' ? 'badge-primary' : 'badge-warning'
                                    }`}>
                                    {project.status}
                                </span>
                            </div>

                            <p className="text-gray-600 mb-4 line-clamp-3">{project.description}</p>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Priority</span>
                                    <span className={`font-semibold ${project.priority === 'high' ? 'text-red-500' :
                                        project.priority === 'medium' ? 'text-yellow-600' : 'text-green-500'
                                        }`}>
                                        {project.priority.toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Timeline</span>
                                    <span className="text-gray-800">
                                        {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'N/A'} -
                                        {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Ongoing'}
                                    </span>
                                </div>
                            </div>

                            <Link
                                to={`/projects/${project.id}`}
                                className="block w-full text-center btn btn-secondary"
                            >
                                View Dashboard →
                            </Link>
                        </div>
                    ))}

                    {projects.length === 0 && (
                        <div className="col-span-full text-center py-12 glass-card">
                            <p className="text-gray-500 text-lg">No projects found. Start one today!</p>
                        </div>
                    )}
                </div>

                {/* Create Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
                        <div className="glass-card w-full max-w-lg p-8 animate-scale-in" onClick={e => e.stopPropagation()}>
                            <h2 className="text-2xl font-bold mb-6">Create New Project</h2>
                            <form onSubmit={handleCreateProject} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Project Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="input w-full"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Description</label>
                                    <textarea
                                        className="input w-full h-24 resize-none"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Priority</label>
                                        <select
                                            className="input w-full"
                                            value={formData.priority}
                                            onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Status</label>
                                        <select
                                            className="input w-full"
                                            value={formData.status}
                                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                                        >
                                            <option value="planning">Planning</option>
                                            <option value="active">Active</option>
                                            <option value="on_hold">On Hold</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Start Date</label>
                                        <input
                                            type="date"
                                            className="input w-full"
                                            value={formData.startDate}
                                            onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">End Date</label>
                                        <input
                                            type="date"
                                            className="input w-full"
                                            value={formData.endDate}
                                            onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="btn btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                    >
                                        Create Project
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
