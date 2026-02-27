import { useState, useEffect } from 'react';
import { tasksAPI, projectsAPI, usersAPI } from '../lib/api';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function Tasks() {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'mine', 'assigned'
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Data for dropdowns
    const [projects, setProjects] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        projectId: '',
        assignedTo: '',
        priority: 'medium',
        dueDate: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleTaskCreated = (data: any) => {
            console.log("Task created event received:", data);
            setTasks(prev => {
                if (prev.some(t => t.id === data.task.id)) return prev;
                return [data.task, ...prev];
            });
        };

        const handleTaskUpdated = (data: any) => {
            console.log("Task updated event received:", data);
            setTasks(prev => prev.map(t => t.id === data.task.id ? data.task : t));
        };

        socket.on('task_created', handleTaskCreated);
        socket.on('task_updated', handleTaskUpdated);

        return () => {
            socket.off('task_created', handleTaskCreated);
            socket.off('task_updated', handleTaskUpdated);
        };
    }, [socket]);

    const loadData = async () => {
        try {
            const [tasksRes, projectsRes, usersRes] = await Promise.all([
                tasksAPI.getAll(),
                projectsAPI.getAll(),
                usersAPI.getAll()
            ]);
            setTasks(tasksRes.data.tasks);
            setProjects(projectsRes.data.projects);
            setUsers(usersRes.data.users);
        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await tasksAPI.create({
                ...formData,
                projectId: formData.projectId ? parseInt(formData.projectId) : undefined,
                assignedTo: formData.assignedTo ? parseInt(formData.assignedTo) : undefined
            });
            setShowCreateModal(false);
            // Reset form
            setFormData({
                title: '',
                description: '',
                projectId: '',
                assignedTo: '',
                priority: 'medium',
                dueDate: ''
            });
            // Refresh
            const res = await tasksAPI.getAll();
            setTasks(res.data.tasks);
        } catch (error) {
            console.error('Failed to create task', error);
        }
    };

    const filteredTasks = tasks.filter(task => {
        if (filter === 'mine') return task.assigned_to === user?.id;
        if (filter === 'completed') return task.status === 'completed';
        if (filter === 'active') return task.status !== 'completed';
        return true;
    });

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
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Tasks</h1>
                        <p className="text-gray-600">Track and manage all deliverables</p>
                    </div>
                    <div className="flex gap-4">
                        <select
                            className="input py-2"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        >
                            <option value="all">All Tasks</option>
                            <option value="mine">My Tasks</option>
                            <option value="active">Active Only</option>
                            <option value="completed">Completed</option>
                        </select>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="btn btn-primary whitespace-nowrap"
                        >
                            + New Task
                        </button>
                    </div>
                </div>

                <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Task</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Project</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Assignee</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Priority</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Due</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredTasks.map((task, index) => {
                                    const assignee = users.find(u => u.id === task.assigned_to);
                                    const project = projects.find(p => p.id === task.project_id);

                                    return (
                                        <tr
                                            key={task.id}
                                            className="hover:bg-gray-50/50 transition animate-slide-up"
                                            style={{ animationDelay: `${index * 30}ms` }}
                                        >
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-gray-800">{task.title}</p>
                                                <p className="text-xs text-gray-500 truncate max-w-xs">{task.description}</p>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {project ? (
                                                    <span className="badge badge-purple">{project.name}</span>
                                                ) : <span className="text-gray-400">-</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                {assignee ? (
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                                            {assignee.full_name.charAt(0)}
                                                        </div>
                                                        <span className="text-sm text-gray-700">{assignee.full_name}</span>
                                                    </div>
                                                ) : <span className="text-sm text-gray-400">Unassigned</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`badge ${task.status === 'completed' ? 'badge-success' :
                                                    task.status === 'in_progress' ? 'badge-primary' :
                                                        task.status === 'blocked' ? 'badge-danger' : 'badge-warning'
                                                    }`}>
                                                    {task.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-xs font-bold uppercase ${task.priority === 'high' ? 'text-red-500' :
                                                    task.priority === 'medium' ? 'text-yellow-600' : 'text-green-500'
                                                    }`}>
                                                    {task.priority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {filteredTasks.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No tasks found matching current filters.</p>
                        </div>
                    )}
                </div>

                {/* Create Task Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
                        <div className="glass-card w-full max-w-lg p-8 animate-scale-in" onClick={e => e.stopPropagation()}>
                            <h2 className="text-2xl font-bold mb-6">Create New Task</h2>
                            <form onSubmit={handleCreateTask} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Title</label>
                                    <input
                                        type="text"
                                        required
                                        className="input w-full"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
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
                                        <label className="block text-sm font-semibold mb-1">Project</label>
                                        <select
                                            className="input w-full"
                                            value={formData.projectId}
                                            onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                                        >
                                            <option value="">Select Project...</option>
                                            {projects.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Assignee</label>
                                        <select
                                            className="input w-full"
                                            value={formData.assignedTo}
                                            onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
                                        >
                                            <option value="">Unassigned</option>
                                            {users.map(u => (
                                                <option key={u.id} value={u.id}>{u.full_name}</option>
                                            ))}
                                        </select>
                                    </div>
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
                                        <label className="block text-sm font-semibold mb-1">Due Date</label>
                                        <input
                                            type="date"
                                            className="input w-full"
                                            value={formData.dueDate}
                                            onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
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
                                        Create Task
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
