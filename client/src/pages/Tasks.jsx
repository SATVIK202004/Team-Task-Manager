import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineFilter,
  HiOutlineTrash,
  HiOutlineSearch
} from 'react-icons/hi';

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    project: '',
    status: '',
    priority: '',
    search: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const queryParts = [];
      if (filters.project) queryParts.push(`project=${filters.project}`);
      if (filters.status) queryParts.push(`status=${filters.status}`);
      if (filters.priority) queryParts.push(`priority=${filters.priority}`);

      const query = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
      const [tasksRes, projRes] = await Promise.all([
        api.get(`/tasks${query}`),
        api.get('/projects')
      ]);
      setTasks(tasksRes.data);
      setProjects(projRes.data);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters.project, filters.status, filters.priority]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update');
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const isOverdue = (task) => {
    return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric'
    });
  };

  // client-side search filtering
  const filteredTasks = tasks.filter(task => {
    if (!filters.search) return true;
    const q = filters.search.toLowerCase();
    return (
      task.title.toLowerCase().includes(q) ||
      task.description?.toLowerCase().includes(q) ||
      task.assignedTo?.name?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner"></div>
        <p>Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="tasks-page">
      <div className="page-header">
        <div>
          <h1>All Tasks</h1>
          <p className="page-desc">{filteredTasks.length} tasks found</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="search-box">
          <HiOutlineSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>
        <div className="filter-group">
          <HiOutlineFilter className="filter-icon" />
          <select
            value={filters.project}
            onChange={(e) => setFilters(prev => ({ ...prev, project: e.target.value }))}
          >
            <option value="">All Projects</option>
            {projects.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="">All Status</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <select
            value={filters.priority}
            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
          >
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="empty-state">
          <p>No tasks match your filters.</p>
        </div>
      ) : (
        <div className="task-table-wrapper">
          <table className="task-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assigned To</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map(task => (
                <tr key={task._id} className={isOverdue(task) ? 'overdue-row' : ''}>
                  <td>
                    <div className="task-cell">
                      <span className="task-title-text">{task.title}</span>
                      {task.description && (
                        <span className="task-desc-text">{task.description.substring(0, 60)}{task.description.length > 60 ? '...' : ''}</span>
                      )}
                    </div>
                  </td>
                  <td><span className="project-badge">{task.project?.name}</span></td>
                  <td>
                    <select
                      className={`status-select status-${task.status}`}
                      value={task.status}
                      onChange={(e) => handleStatusChange(task._id, e.target.value)}
                    >
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </td>
                  <td>
                    <span className={`priority-tag priority-${task.priority}`}>{task.priority}</span>
                  </td>
                  <td>{task.assignedTo?.name || '—'}</td>
                  <td>
                    <span className={isOverdue(task) ? 'overdue-text' : ''}>
                      {task.dueDate ? formatDate(task.dueDate) : '—'}
                    </span>
                  </td>
                  <td>
                    {(user?.role === 'admin' || task.createdBy?._id === user?._id) && (
                      <button className="btn-icon danger" onClick={() => handleDelete(task._id)}>
                        <HiOutlineTrash />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
