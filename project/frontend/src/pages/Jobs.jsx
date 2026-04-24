import React, { useState, useEffect } from 'react';
import { jobService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const TYPE_LABEL = { full: 'Full-time', intern: 'Стажировка', part: 'Part-time' };
const TYPE_CLASS  = { full: 'jt-full',  intern: 'jt-intern',  part: 'jt-part' };

function SlotsBar({ taken, total }) {
  const pct = total > 0 ? (taken / total) * 100 : 0;
  const free = total - taken;
  const color = pct >= 100 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#22c55e';
  return (
    <div className="slots-wrap">
      <div className="slots-bar-bg">
        <div className="slots-bar-fill" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
      </div>
      <div className="slots-text">
        <span style={{ color }}>{free > 0 ? `${free} мест свободно` : 'Мест нет'}</span>
        <span className="slots-total">{taken}/{total}</span>
      </div>
    </div>
  );
}

export default function Jobs() {
  const { user, isAuth } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [applying, setApplying] = useState({});
  const [msg, setMsg] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  const fetchJobs = () => {
    setLoading(true);
    jobService.getAll()
      .then(r => setJobs(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchJobs(); }, []);

  const hasApplied = (job) => isAuth && user?.role === 'student' &&
    job.applicants?.some(a => a.userId === user.id || a.email === user.email);

  const handleApply = async (jobId) => {
    if (!isAuth) return setMsg(m => ({ ...m, [jobId]: 'Войдите, чтобы подать заявку' }));
    setApplying(a => ({ ...a, [jobId]: true }));
    try {
      const r = await jobService.apply(jobId);
      setMsg(m => ({ ...m, [jobId]: r.message || 'Заявка подана!' }));
      fetchJobs();
    } catch (err) {
      setMsg(m => ({ ...m, [jobId]: err.message }));
    } finally {
      setApplying(a => ({ ...a, [jobId]: false }));
    }
  };

  const handleCancel = async (jobId) => {
    setApplying(a => ({ ...a, [jobId]: true }));
    try {
      await jobService.cancelApply(jobId);
      setMsg(m => ({ ...m, [jobId]: 'Заявка отменена' }));
      fetchJobs();
    } catch (err) {
      setMsg(m => ({ ...m, [jobId]: err.message }));
    } finally {
      setApplying(a => ({ ...a, [jobId]: false }));
    }
  };

  const filtered = jobs
    .filter(j => filter === 'all' || j.type === filter)
    .filter(j => !search || j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.company.toLowerCase().includes(search.toLowerCase()) ||
      (j.skills || []).some(s => s.toLowerCase().includes(search.toLowerCase())));

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">💼 Вакансии</h2>
          <p className="page-sub">Найдите работу или стажировку мечты</p>
        </div>
        {isAuth && user?.role === 'employer' && (
          <Link to="/jobs/add" className="btn btn-primary">+ Добавить вакансию</Link>
        )}
      </div>

      <div className="toolbar">
        <input
          className="search-input"
          placeholder="🔍 Поиск по вакансии, компании, навыку..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="filter-row">
          {[['all','Все'], ['full','Full-time'], ['intern','Стажировка'], ['part','Part-time']].map(([k, lbl]) => (
            <button key={k} className={'filter-btn' + (filter === k ? ' on' : '')} onClick={() => setFilter(k)}>{lbl}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /> Загрузка вакансий...</div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">💼</div>
          <p>Вакансий не найдено. {isAuth && user?.role === 'employer' && <Link to="/jobs/add">Добавьте первую!</Link>}</p>
        </div>
      ) : (
        <div className="jobs-grid">
          {filtered.map(job => {
            const applied = hasApplied(job);
            const full = (job.freeSlots ?? (job.totalSlots - (job.applicants?.length || 0))) <= 0;
            const isExpanded = expandedId === job._id;
            return (
              <div className={'job-card' + (isExpanded ? ' expanded' : '')} key={job._id}>
                <span className={`job-type-tag ${TYPE_CLASS[job.type]}`}>{TYPE_LABEL[job.type]}</span>
                <div className="job-title">{job.title}</div>
                <div className="job-company">🏢 {job.company}</div>
                {job.salary && <div className="job-salary">💰 {job.salary}</div>}
                {job.location && <div className="job-loc">📍 {job.location}</div>}

                <SlotsBar taken={job.applicants?.length || 0} total={job.totalSlots || 10} />

                <div className="job-skills">
                  {(job.skills || []).map(s => <span key={s} className="skill-pill">{s}</span>)}
                </div>

                {isExpanded && job.description && (
                  <div className="job-desc">{job.description}</div>
                )}

                <div className="job-actions">
                  <button className="btn-ghost-sm" onClick={() => setExpandedId(isExpanded ? null : job._id)}>
                    {isExpanded ? '▲ Свернуть' : '▼ Подробнее'}
                  </button>
                  {user?.role === 'student' && (
                    applied ? (
                      <button className="job-rsvp-btn cancel" onClick={() => handleCancel(job._id)} disabled={applying[job._id]}>
                        {applying[job._id] ? '...' : '✓ Отменить заявку'}
                      </button>
                    ) : (
                      <button className="job-rsvp-btn" onClick={() => handleApply(job._id)} disabled={applying[job._id] || full}>
                        {applying[job._id] ? '...' : full ? 'Мест нет' : 'Подать заявку →'}
                      </button>
                    )
                  )}
                  {!isAuth && (
                    <Link to="/auth" className="job-rsvp-btn">Войдите для подачи →</Link>
                  )}
                </div>

                {msg[job._id] && (
                  <div className={'job-msg ' + (msg[job._id].includes('подана') || msg[job._id].includes('!') ? 'success' : 'error')}>
                    {msg[job._id]}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
