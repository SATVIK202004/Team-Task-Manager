import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlinePlus,
  HiOutlineFolder,
  HiOutlineTrash,
  HiOutlineUserGroup
} from 'react-icons/hi';

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSubmitting(true);
    setError('');
    try {
      await api.post('/projects', formData);
      setShowModal(false);
      setFormData({ name: '', description: '' });
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (projectId) => {
    if (!window.confirm('Delete this project and all its tasks? This cannot be undone.')) return;

    try {
      await api.delete(`/projects/${projectId}`);
      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete project');
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner"></div>
        <p>Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="projects-page">
      <div className="page-header">
        <div>
          <h1>Projects</h1>
          <p className="page-desc">Manage your team projects</p>
        </div>
        {user?.role === 'admin' && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <HiOutlinePlus /> New Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <HiOutlineFolder className="empty-icon" />
          <p>No projects found. {user?.role === 'admin' ? 'Create your first project!' : 'Ask an admin to add you to a project.'}</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(project => (
            <div key={project._id} className="project-card">
              <div className="project-card-header">
                <Link to={`/projects/${project._id}`} className="project-name">
                  {project.name}
                </Link>
                {user?.role === 'admin' && (
                  <button
                    className="btn-icon danger"
                    onClick={() => handleDelete(project._id)}
                    title="Delete project"
                  >
                    <HiOutlineTrash />
                  </button>
                )}
              </div>
              {project.description && (
                <p className="project-desc">{project.description}</p>
              )}
              <div className="project-card-footer">
                <span className="member-count">
                  <HiOutlineUserGroup />
                  {project.members?.length || 0} members
                </span>
                <Link to={`/projects/${project._id}`} className="btn btn-sm btn-outline">
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Create New Project</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label htmlFor="project-name">Project Name</label>
                <input
                  id="project-name"
                  type="text"
                  placeholder="e.g. Website Redesign"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="project-desc">Description (optional)</label>
                <textarea
                  id="project-desc"
                  placeholder="Brief description of the project"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
