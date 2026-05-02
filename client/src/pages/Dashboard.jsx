import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  HiOutlineClipboardList,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamation,
  HiOutlineFire,
  HiOutlineRefresh
} from 'react-icons/hi';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tasks/dashboard/stats');
      setStats(res.data.stats);
      setRecentTasks(res.data.recentTasks);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric'
    });
  };

  const isOverdue = (task) => {
    return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Tasks', value: stats?.total || 0, icon: <HiOutlineClipboardList />, color: 'blue' },
    { label: 'To Do', value: stats?.todo || 0, icon: <HiOutlineClock />, color: 'yellow' },
    { label: 'In Progress', value: stats?.inProgress || 0, icon: <HiOutlineRefresh />, color: 'purple' },
    { label: 'Completed', value: stats?.done || 0, icon: <HiOutlineCheckCircle />, color: 'green' },
    { label: 'Overdue', value: stats?.overdue || 0, icon: <HiOutlineExclamation />, color: 'red' },
    { label: 'High Priority', value: stats?.highPriority || 0, icon: <HiOutlineFire />, color: 'orange' },
  ];

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="page-desc">Overview of your tasks and projects</p>
      </div>

      <div className="stats-grid">
        {statCards.map((card) => (
          <div key={card.label} className={`stat-card stat-${card.color}`}>
            <div className="stat-icon">{card.icon}</div>
            <div className="stat-info">
              <span className="stat-value">{card.value}</span>
              <span className="stat-label">{card.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-section">
        <div className="section-header">
          <h2>Recent Tasks</h2>
          <Link to="/tasks" className="btn btn-sm btn-outline">View All</Link>
        </div>

        {recentTasks.length === 0 ? (
          <div className="empty-state">
            <HiOutlineClipboardList className="empty-icon" />
            <p>No tasks yet. Create a project and start adding tasks!</p>
            <Link to="/projects" className="btn btn-primary">Go to Projects</Link>
          </div>
        ) : (
          <div className="task-list">
            {recentTasks.map(task => (
              <div key={task._id} className={`task-item ${isOverdue(task) ? 'overdue' : ''}`}>
                <div className="task-left">
                  <span className={`status-dot status-${task.status}`}></span>
                  <div className="task-info">
                    <span className="task-title">{task.title}</span>
                    <span className="task-meta">
                      {task.project?.name}
                      {task.assignedTo && ` · ${task.assignedTo.name}`}
                    </span>
                  </div>
                </div>
                <div className="task-right">
                  <span className={`priority-tag priority-${task.priority}`}>
                    {task.priority}
                  </span>
                  {task.dueDate && (
                    <span className={`due-date ${isOverdue(task) ? 'overdue-text' : ''}`}>
                      {formatDate(task.dueDate)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
