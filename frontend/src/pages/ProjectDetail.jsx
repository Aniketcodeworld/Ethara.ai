import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

export default function ProjectDetail() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assigneeId: '', status: 'TODO' });
  const [editingTask, setEditingTask] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');

  const fetchProject = () => {
    API.get(`/projects/${id}`).then(res => { setProject(res.data); setTasks(res.data.tasks || []); setLoading(false); })
      .catch(() => { navigate('/projects'); });
  };

  const fetchUsers = () => {
    if (isAdmin) API.get('/users').then(res => setUsers(res.data)).catch(() => {});
  };

  useEffect(() => { fetchProject(); fetchUsers(); }, [id]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...taskForm, assigneeId: taskForm.assigneeId || null };
      if (editingTask) {
        await API.put(`/tasks/${editingTask.id}`, payload);
      } else {
        await API.post(`/projects/${id}/tasks`, payload);
      }
      setShowTaskModal(false);
      setEditingTask(null);
      setTaskForm({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assigneeId: '', status: 'TODO' });
      fetchProject();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed');
    }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      await API.put(`/tasks/${taskId}`, { status });
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try { await API.delete(`/tasks/${taskId}`); fetchProject(); } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setTaskForm({ title: task.title, description: task.description || '', priority: task.priority, dueDate: task.dueDate || '', assigneeId: task.assigneeId || '', status: task.status });
    setShowTaskModal(true);
  };

  const handleAddMember = async (userId) => {
    try { await API.post(`/projects/${id}/members`, { userId }); fetchProject(); setShowMemberModal(false); }
    catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try { await API.delete(`/projects/${id}/members/${userId}`); fetchProject(); }
    catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (!project) return null;

  const memberIds = project.members?.map(m => m.id) || [];
  const filteredTasks = filter === 'ALL' ? tasks : tasks.filter(t => t.status === filter);
  const todoTasks = tasks.filter(t => t.status === 'TODO');
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS');
  const doneTasks = tasks.filter(t => t.status === 'DONE');

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <button className="btn-back" onClick={() => navigate('/projects')}>← Back</button>
          <h1>{project.name}</h1>
          <p className="page-subtitle">{project.description || 'No description'}</p>
        </div>
        <div className="header-actions">
          {isAdmin && <button className="btn btn-secondary" onClick={() => setShowMemberModal(true)}>+ Add Member</button>}
          <button className="btn btn-primary" onClick={() => { setEditingTask(null); setTaskForm({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assigneeId: '', status: 'TODO' }); setShowTaskModal(true); }}>+ New Task</button>
        </div>
      </div>

      {/* Members */}
      <div className="card members-section">
        <h3>Team Members ({project.members?.length || 0})</h3>
        <div className="members-list">
          {project.members?.map(member => (
            <div key={member.id} className="member-chip">
              <span className="member-avatar">{member.name.charAt(0).toUpperCase()}</span>
              <span className="member-name">{member.name}</span>
              <span className={`member-role role-${member.ProjectMember?.role?.toLowerCase()}`}>{member.ProjectMember?.role}</span>
              {isAdmin && member.ProjectMember?.role !== 'OWNER' && (
                <button className="btn-remove" onClick={() => handleRemoveMember(member.id)}>✕</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Task Board */}
      <div className="task-board-header">
        <h3>Tasks ({tasks.length})</h3>
        <div className="filter-tabs">
          {['ALL', 'TODO', 'IN_PROGRESS', 'DONE'].map(f => (
            <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'ALL' ? `All (${tasks.length})` : f === 'TODO' ? `To Do (${todoTasks.length})` : f === 'IN_PROGRESS' ? `In Progress (${inProgressTasks.length})` : `Done (${doneTasks.length})`}
            </button>
          ))}
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="empty-state small">
          <p>No tasks {filter !== 'ALL' ? `with status "${filter.replace('_', ' ')}"` : 'yet'}.</p>
        </div>
      ) : (
        <div className="task-cards-grid">
          {filteredTasks.map(task => {
            const isOverdue = task.dueDate && task.status !== 'DONE' && new Date(task.dueDate) < new Date();
            return (
              <div key={task.id} className={`task-card ${isOverdue ? 'task-overdue' : ''}`}>
                <div className="task-card-top">
                  <span className={`badge priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
                  <div className="task-card-actions">
                    <button className="btn-icon" onClick={() => openEditTask(task)} title="Edit">✏️</button>
                    {isAdmin && <button className="btn-icon" onClick={() => handleDeleteTask(task.id)} title="Delete">🗑️</button>}
                  </div>
                </div>
                <h4 className="task-card-title">{task.title}</h4>
                {task.description && <p className="task-card-desc">{task.description}</p>}
                <div className="task-card-meta">
                  {task.assignee ? (
                    <span className="task-assignee"><span className="mini-avatar">{task.assignee.name.charAt(0)}</span> {task.assignee.name}</span>
                  ) : <span className="task-assignee unassigned">Unassigned</span>}
                  {task.dueDate && <span className={`task-due ${isOverdue ? 'overdue' : ''}`}>📅 {task.dueDate}</span>}
                </div>
                <div className="task-status-select">
                  <select value={task.status} onChange={e => handleStatusChange(task.id, e.target.value)}>
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTask ? 'Edit Task' : 'Create New Task'}</h2>
              <button className="modal-close" onClick={() => setShowTaskModal(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label>Title</label>
                <input type="text" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="Task title" required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} placeholder="Optional description" rows="2"></textarea>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select value={taskForm.status} onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}>
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Due Date</label>
                  <input type="date" value={taskForm.dueDate} onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Assignee</label>
                  <select value={taskForm.assigneeId} onChange={e => setTaskForm({ ...taskForm, assigneeId: e.target.value })}>
                    <option value="">Unassigned</option>
                    {project.members?.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingTask ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Team Member</h2>
              <button className="modal-close" onClick={() => setShowMemberModal(false)}>✕</button>
            </div>
            <div className="user-select-list">
              {users.filter(u => !memberIds.includes(u.id)).length === 0 ? (
                <p className="empty-text">All users are already members of this project.</p>
              ) : (
                users.filter(u => !memberIds.includes(u.id)).map(u => (
                  <div key={u.id} className="user-select-item">
                    <div className="user-select-info">
                      <span className="member-avatar">{u.name.charAt(0).toUpperCase()}</span>
                      <div>
                        <span className="user-select-name">{u.name}</span>
                        <span className="user-select-email">{u.email}</span>
                      </div>
                    </div>
                    <button className="btn btn-sm btn-primary" onClick={() => handleAddMember(u.id)}>Add</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
