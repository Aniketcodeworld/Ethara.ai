import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/dashboard').then(res => { setData(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (!data) return <div className="page-content"><p>Failed to load dashboard.</p></div>;

  const { stats, overdueTasks, recentTasks } = data;

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="page-subtitle">Welcome back, <strong>{user.name}</strong></p>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <span className="stat-number">{stats.totalTasks}</span>
            <span className="stat-label">Total Tasks</span>
          </div>
        </div>
        <div className="stat-card stat-todo">
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <span className="stat-number">{stats.todoTasks}</span>
            <span className="stat-label">To Do</span>
          </div>
        </div>
        <div className="stat-card stat-progress">
          <div className="stat-icon">🔄</div>
          <div className="stat-info">
            <span className="stat-number">{stats.inProgressTasks}</span>
            <span className="stat-label">In Progress</span>
          </div>
        </div>
        <div className="stat-card stat-done">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <span className="stat-number">{stats.doneTasks}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>
        <div className="stat-card stat-projects">
          <div className="stat-icon">📁</div>
          <div className="stat-info">
            <span className="stat-number">{stats.projectCount}</span>
            <span className="stat-label">Projects</span>
          </div>
        </div>
        {isAdmin && (
          <div className="stat-card stat-users">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <span className="stat-number">{stats.userCount}</span>
              <span className="stat-label">Users</span>
            </div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="card progress-overview">
        <h3>Task Completion</h3>
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${stats.totalTasks ? Math.round((stats.doneTasks / stats.totalTasks) * 100) : 0}%` }}>
            {stats.totalTasks ? Math.round((stats.doneTasks / stats.totalTasks) * 100) : 0}%
          </div>
        </div>
        <div className="progress-legend">
          <span className="legend-item"><span className="dot dot-todo"></span> To Do: {stats.todoTasks}</span>
          <span className="legend-item"><span className="dot dot-progress"></span> In Progress: {stats.inProgressTasks}</span>
          <span className="legend-item"><span className="dot dot-done"></span> Done: {stats.doneTasks}</span>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Overdue tasks */}
        <div className="card">
          <h3>⚠️ Overdue Tasks</h3>
          {overdueTasks.length === 0 ? (
            <p className="empty-text">No overdue tasks! 🎉</p>
          ) : (
            <div className="task-list">
              {overdueTasks.map(task => (
                <div key={task.id} className="task-item overdue">
                  <div className="task-item-header">
                    <span className="task-title">{task.title}</span>
                    <span className={`badge priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
                  </div>
                  <div className="task-item-meta">
                    <span>📁 {task.project?.name}</span>
                    <span>👤 {task.assignee?.name || 'Unassigned'}</span>
                    <span className="overdue-date">📅 Due: {task.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent tasks */}
        <div className="card">
          <h3>🕐 Recent Tasks</h3>
          {recentTasks.length === 0 ? (
            <p className="empty-text">No tasks yet. Create a project and start adding tasks!</p>
          ) : (
            <div className="task-list">
              {recentTasks.map(task => (
                <div key={task.id} className="task-item">
                  <div className="task-item-header">
                    <span className="task-title">{task.title}</span>
                    <span className={`badge status-${task.status.toLowerCase().replace('_', '-')}`}>{task.status.replace('_', ' ')}</span>
                  </div>
                  <div className="task-item-meta">
                    <span>📁 {task.project?.name}</span>
                    <span>👤 {task.assignee?.name || 'Unassigned'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
