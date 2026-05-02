import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

export default function Projects() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');

  const fetchProjects = () => {
    API.get('/projects').then(res => { setProjects(res.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await API.post('/projects', form);
      setShowModal(false);
      setForm({ name: '', description: '' });
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await API.delete(`/projects/${id}`);
      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete project');
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Projects</h1>
        {isAdmin && <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>}
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📁</span>
          <h3>No projects yet</h3>
          <p>{isAdmin ? 'Create your first project to get started!' : 'You haven\'t been added to any projects yet.'}</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(project => {
            const progress = project.taskCount ? Math.round((project.completedTaskCount / project.taskCount) * 100) : 0;
            return (
              <Link to={`/projects/${project.id}`} key={project.id} className="project-card">
                <div className="project-card-header">
                  <h3>{project.name}</h3>
                  <span className={`badge status-${project.status.toLowerCase()}`}>{project.status}</span>
                </div>
                <p className="project-desc">{project.description || 'No description'}</p>
                <div className="project-progress">
                  <div className="progress-bar-sm-container">
                    <div className="progress-bar-sm" style={{ width: `${progress}%` }}></div>
                  </div>
                  <span className="progress-text">{progress}% complete</span>
                </div>
                <div className="project-footer">
                  <span className="project-meta">📋 {project.taskCount} tasks</span>
                  <span className="project-meta">👥 {project.members?.length || 0} members</span>
                  {isAdmin && (
                    <button className="btn-icon btn-danger-icon" onClick={(e) => { e.preventDefault(); handleDelete(project.id); }} title="Delete">🗑️</button>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Project</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Project Name</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter project name" required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Project description (optional)" rows="3"></textarea>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
