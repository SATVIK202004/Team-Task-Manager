import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineArrowLeft,
  HiOutlineUserAdd,
  HiOutlineUserRemove
} from 'react-icons/hi';

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [memberEmail, setMemberEmail] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [memberError, setMemberError] = useState('');
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    assignedTo: '',
    dueDate: ''
  });

  const fetchProject = async () => {
    try {
      const [projRes, tasksRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks?project=${id}`)
      ]);
      setProject(projRes.data);
      setTasks(tasksRes.data);
    } catch (err) {
      console.error('Failed to load project:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    setMemberError('');
    try {
      const res = await api.post(`/projects/${id}/members`, { email: memberEmail });
      setProject(res.data);
      setMemberEmail('');
      setShowAddMember(false);
    } catch (err) {
      setMemberError(err.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member from the project?')) return;
    try {
      const res = await api.delete(`/projects/${id}/members/${userId}`);
      setProject(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...taskForm,
        project: id,
        assignedTo: taskForm.assignedTo || undefined,
        dueDate: taskForm.dueDate || undefined
      };
      await api.post('/tasks', payload);
      setShowTaskForm(false);
      setTaskForm({ title: '', description: '', priority: 'medium', status: 'todo', assignedTo: '', dueDate: '' });
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update task');
    }
  };

  const isOverdue = (task) => {
    return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner"></div>
        <p>Loading project...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="empty-state">
        <p>Project not found or you don't have access.</p>
        <Link to="/projects" className="btn btn-primary">Back to Projects</Link>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';

  return (
    <div className="project-detail-page">
      <Link to="/projects" className="back-link">
        <HiOutlineArrowLeft /> Back to Projects
      </Link>

      <div className="page-header">
        <div>
          <h1>{project.name}</h1>
          {project.description && <p className="page-desc">{project.description}</p>}
        </div>
        <button className="btn btn-primary" onClick={() => setShowTaskForm(true)}>
          <HiOutlinePlus /> Add Task
        </button>
      </div>

      {/* Members Section */}
      <div className="detail-section">
        <div className="section-header">
          <h2>Team Members ({project.members?.length || 0})</h2>
          {isAdmin && (
            <button className="btn btn-sm btn-outline" onClick={() => setShowAddMember(!showAddMember)}>
              <HiOutlineUserAdd /> Add Member
            </button>
          )}
        </div>

        {showAddMember && (
          <form className="inline-form" onSubmit={handleAddMember}>
            {memberError && <div className="alert alert-error">{memberError}</div>}
            <input
              type="email"
              placeholder="Enter member's email"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary btn-sm">Add</button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => { setShowAddMember(false); setMemberError(''); }}>Cancel</button>
          </form>
        )}

        <div className="members-list">
          {project.members?.map(member => (
            <div key={member._id} className="member-item">
              <div className="member-avatar">{member.name.charAt(0).toUpperCase()}</div>
              <div className="member-info">
                <span className="member-name">{member.name}</span>
                <span className="member-email">{member.email}</span>
              </div>
              {isAdmin && member._id !== project.owner._id && (
                <button
                  className="btn-icon danger"
                  onClick={() => handleRemoveMember(member._id)}
                  title="Remove member"
                >
                  <HiOutlineUserRemove />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tasks Section */}
      <div className="detail-section">
        <div className="section-header">
          <h2>Tasks ({tasks.length})</h2>
        </div>

        {tasks.length === 0 ? (
          <div className="empty-state small">
            <p>No tasks yet. Add a task to get started.</p>
          </div>
        ) : (
          <div className="task-list detailed">
            {tasks.map(task => (
              <div key={task._id} className={`task-item ${isOverdue(task) ? 'overdue' : ''}`}>
                <div className="task-left">
                  <select
                    className={`status-select status-${task.status}`}
                    value={task.status}
                    onChange={(e) => handleStatusChange(task._id, e.target.value)}
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                  <div className="task-info">
                    <span className="task-title">{task.title}</span>
                    <span className="task-meta">
                      {task.assignedTo ? `Assigned to ${task.assignedTo.name}` : 'Unassigned'}
                      {task.dueDate && ` · Due ${formatDate(task.dueDate)}`}
                    </span>
                  </div>
                </div>
                <div className="task-right">
                  <span className={`priority-tag priority-${task.priority}`}>{task.priority}</span>
                  {(isAdmin || task.createdBy?._id === user?._id) && (
                    <button className="btn-icon danger" onClick={() => handleDeleteTask(task._id)}>
                      <HiOutlineTrash />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {showTaskForm && (
        <div className="modal-overlay" onClick={() => setShowTaskForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Create New Task</h2>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label htmlFor="task-title">Title</label>
                <input
                  id="task-title"
                  type="text"
                  placeholder="What needs to be done?"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="task-desc">Description</label>
                <textarea
                  id="task-desc"
                  placeholder="Details about this task..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="task-priority">Priority</label>
                  <select
                    id="task-priority"
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="task-status">Status</label>
                  <select
                    id="task-status"
                    value={taskForm.status}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="task-assign">Assign To</label>
                  <select
                    id="task-assign"
                    value={taskForm.assignedTo}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                  >
                    <option value="">Unassigned</option>
                    {project.members?.map(m => (
                      <option key={m._id} value={m._id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="task-due">Due Date</label>
                  <input
                    id="task-due"
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowTaskForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
