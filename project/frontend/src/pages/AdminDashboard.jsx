import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ru-KZ', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

const ROLE_LABELS = { student:'🎓 Студент', teacher:'📚 Преподаватель', employer:'🏢 Работодатель', admin:'⚙️ Админ' };
const ROLE_COLORS = { student:'#3b82f6', teacher:'#8b5cf6', employer:'#f59e0b', admin:'#ef4444' };
const TYPE_LABEL  = { full:'Full-time', intern:'Стажировка', part:'Part-time' };

function PeopleModal({ title, people, onRemove, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <span>{title}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {people.length === 0 ? (
          <div className="modal-empty">Никто не записан</div>
        ) : (
          <div className="modal-list">
            {people.map((p, i) => (
              <div key={p.userId || p.email || i} className="modal-person">
                <div className="modal-person-avatar">{(p.name||'?')[0]}</div>
                <div className="modal-person-info">
                  <strong>{p.name || '—'}</strong>
                  <span>{p.email}</span>
                  {(p.appliedAt || p.enrolledAt) && <span className="modal-when">{fmtDate(p.appliedAt || p.enrolledAt)}</span>}
                </div>
                {onRemove && (
                  <button className="modal-remove" onClick={() => onRemove(p.userId)} title="Удалить">✕</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="adm-stat">
      <div className="adm-stat-icon" style={{ background: color + '18', color }}>{icon}</div>
      <div className="adm-stat-num" style={{ color }}>{value ?? '—'}</div>
      <div className="adm-stat-label">{label}</div>
    </div>
  );
}

const TABS = [
  { key:'overview', label:'📊 Обзор' },
  { key:'users',    label:'👥 Пользователи' },
  { key:'jobs',     label:'💼 Вакансии' },
  { key:'schedule', label:'📅 Расписание' },
];

export default function AdminDashboard() {
  const { user: me } = useAuth();
  const [tab,      setTab]      = useState('overview');
  const [stats,    setStats]    = useState(null);
  const [users,    setUsers]    = useState([]);
  const [jobs,     setJobs]     = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [toast,    setToast]    = useState(null);
  const [modal,    setModal]    = useState(null);
  const [roleEdit, setRoleEdit] = useState({});

  if (!me || me.role !== 'admin') {
    return (
      <div className="empty">
        <div className="empty-icon">🔒</div>
        <p>Только администраторы имеют доступ. <Link to="/auth">Войти</Link></p>
      </div>
    );
  }

  const showToast = (msg, err) => { setToast({ msg, err: !!err }); setTimeout(() => setToast(null), 3500); };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, u, j, sc] = await Promise.all([
        adminService.getStats(), adminService.getUsers(),
        adminService.getJobs(), adminService.getSchedule(),
      ]);
      setStats(s.data); setUsers(u.data||[]); setJobs(j.data||[]); setSchedule(sc.data||[]);
    } catch (err) { showToast(err.message, true); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDeleteUser = async (id) => {
    if (!confirm('Удалить пользователя?')) return;
    try { await adminService.deleteUser(id); setUsers(u => u.filter(x => x._id !== id)); showToast('Пользователь удалён'); }
    catch (err) { showToast(err.message, true); }
  };
  const handleChangeRole = async (id) => {
    const role = roleEdit[id]; if (!role) return;
    try {
      const r = await adminService.changeRole(id, role);
      setUsers(u => u.map(x => x._id === id ? r.data : x));
      setRoleEdit(e => { const n={...e}; delete n[id]; return n; });
      showToast('Роль изменена');
    } catch (err) { showToast(err.message, true); }
  };

  const handleDeleteJob = async (id) => {
    if (!confirm('Удалить вакансию навсегда?')) return;
    try { await adminService.deleteJob(id); setJobs(j => j.filter(x => x._id !== id)); showToast('Вакансия удалена'); }
    catch (err) { showToast(err.message, true); }
  };
  const handleToggleJob = async (id) => {
    try { const r = await adminService.toggleJob(id); setJobs(j => j.map(x => x._id===id ? r.data : x)); showToast(r.data.isActive ? 'Активирована' : 'Скрыта'); }
    catch (err) { showToast(err.message, true); }
  };
  const openJobApplicants = (job) => {
    setModal({
      title: `👥 Заявки: ${job.title}`,
      people: job.applicants || [],
      onRemove: async (userId) => {
        try {
          const r = await adminService.removeApplicant(job._id, userId);
          setJobs(j => j.map(x => x._id===job._id ? r.data : x));
          setModal(m => m ? {...m, people: r.data.applicants||[]} : null);
          showToast('Заявка удалена');
        } catch (err) { showToast(err.message, true); }
      }
    });
  };

  const handleDeleteSlot = async (id) => {
    if (!confirm('Удалить занятие?')) return;
    try { await adminService.deleteSlot(id); setSchedule(s => s.filter(x => x._id !== id)); showToast('Занятие удалено'); }
    catch (err) { showToast(err.message, true); }
  };
  const openSlotStudents = (slot) => {
    setModal({
      title: `👥 Студенты: ${slot.subject}`,
      people: slot.enrolledStudents || [],
      onRemove: async (userId) => {
        try {
          const r = await adminService.removeStudent(slot._id, userId);
          setSchedule(s => s.map(x => x._id===slot._id ? r.data : x));
          setModal(m => m ? {...m, people: r.data.enrolledStudents||[]} : null);
          showToast('Студент удалён');
        } catch (err) { showToast(err.message, true); }
      }
    });
  };

  return (
    <div className="adm-page">
      {toast && <div className={'toast' + (toast.err ? ' toast-err' : '')}>{toast.msg}</div>}
      {modal && <PeopleModal {...modal} onClose={() => setModal(null)} />}

      <div className="adm-header">
        <div>
          <h2 className="adm-title">⚙️ Панель администратора</h2>
          <p className="adm-sub">AITU Career Fair — полное управление платформой</p>
        </div>
        <button className="btn btn-outline" onClick={fetchAll} disabled={loading}>
          {loading ? <><span className="spinner" /> Загрузка</> : '🔄 Обновить'}
        </button>
      </div>

      <div className="adm-tabs">
        {TABS.map(t => (
          <button key={t.key} className={'adm-tab' + (tab===t.key ? ' active' : '')} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <div>
          {stats ? (
            <div className="adm-stats-grid">
              <StatCard icon="👥" label="Всего пользователей" value={stats.totalUsers} color="#3b82f6" />
              <StatCard icon="🎓" label="Студентов" value={stats.students} color="#8b5cf6" />
              <StatCard icon="📚" label="Преподавателей" value={stats.teachers} color="#06b6d4" />
              <StatCard icon="🏢" label="Работодателей" value={stats.employers} color="#f59e0b" />
              <StatCard icon="💼" label="Вакансий" value={stats.totalJobs} color="#10b981" />
              <StatCard icon="📋" label="Заявок" value={stats.totalApplications} color="#6366f1" />
              <StatCard icon="📅" label="Занятий" value={stats.totalSlots} color="#ec4899" />
              <StatCard icon="✅" label="Записей" value={stats.totalEnrollments} color="#14b8a6" />
            </div>
          ) : <div className="loading"><div className="spinner" /></div>}

          <div className="adm-quick">
            <div className="adm-quick-title">🚀 Быстрые действия</div>
            <div className="adm-quick-grid">
              {[
                { label:'Добавить вакансию', icon:'💼', to:'/jobs/add',      color:'#3b82f6' },
                { label:'Добавить занятие',  icon:'📅', to:'/schedule/add',  color:'#8b5cf6' },
                { label:'Все вакансии',      icon:'🔍', to:'/jobs',          color:'#10b981' },
                { label:'Расписание',        icon:'📆', to:'/schedule',      color:'#f59e0b' },
              ].map(a => (
                <Link key={a.to} to={a.to} className="adm-action-card" style={{ borderColor: a.color+'40' }}>
                  <span className="adm-action-icon" style={{ color: a.color }}>{a.icon}</span>
                  <span>{a.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* USERS */}
      {tab === 'users' && (
        <div className="adm-table-wrap">
          <div className="adm-table-head">
            <span>Пользователи <span className="badge">{users.length}</span></span>
          </div>
          <div className="tbl-scroll">
            <table className="adm-table">
              <thead><tr><th>#</th><th>Имя</th><th>Email</th><th>Роль</th><th>Дата</th><th>Действия</th></tr></thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u._id}>
                    <td className="td-num">{i+1}</td>
                    <td>
                      <div className="td-user">
                        <div className="td-avatar">{(u.name||'?')[0]}</div>
                        <div>
                          <strong>{u.name}</strong>
                          {u.companyName && <div className="td-sub">{u.companyName}</div>}
                          {u.department  && <div className="td-sub">{u.department}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="td-email">{u.email}</td>
                    <td>
                      <div style={{display:'flex',flexDirection:'column',gap:'.35rem'}}>
                        <span className="role-badge" style={{ background: ROLE_COLORS[u.role]+'18', color: ROLE_COLORS[u.role] }}>
                          {ROLE_LABELS[u.role]}
                        </span>
                        {u._id !== me?.id && (
                          <div style={{display:'flex',gap:'.25rem',alignItems:'center'}}>
                            <select className="role-select-mini" value={roleEdit[u._id]||''} onChange={e => setRoleEdit(r=>({...r,[u._id]:e.target.value}))}>
                              <option value="">Изменить</option>
                              {['student','teacher','employer','admin'].filter(r=>r!==u.role).map(r=>(
                                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                              ))}
                            </select>
                            {roleEdit[u._id] && <button className="btn-xs ok" onClick={()=>handleChangeRole(u._id)}>✓</button>}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="td-date">{fmtDate(u.createdAt)}</td>
                    <td>
                      {u._id !== me?.id && (
                        <button className="btn-xs danger" onClick={()=>handleDeleteUser(u._id)}>🗑️ Удалить</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* JOBS */}
      {tab === 'jobs' && (
        <div className="adm-table-wrap">
          <div className="adm-table-head">
            <span>Вакансии <span className="badge">{jobs.length}</span></span>
            <Link to="/jobs/add" className="btn btn-primary btn-sm">+ Добавить</Link>
          </div>
          <div className="tbl-scroll">
            <table className="adm-table">
              <thead><tr><th>#</th><th>Вакансия</th><th>Тип</th><th>Заявки / Места</th><th>Статус</th><th>Действия</th></tr></thead>
              <tbody>
                {jobs.map((job, i) => {
                  const taken = job.applicants?.length || 0;
                  const free  = Math.max(0, job.totalSlots - taken);
                  const pct   = job.totalSlots > 0 ? (taken/job.totalSlots)*100 : 0;
                  return (
                    <tr key={job._id} className={job.isActive ? '' : 'row-muted'}>
                      <td className="td-num">{i+1}</td>
                      <td>
                        <strong>{job.title}</strong>
                        <div className="td-sub">🏢 {job.company}</div>
                        {job.salary && <div className="td-sub">💰 {job.salary}</div>}
                      </td>
                      <td><span className={`job-type-tag jt-${job.type}`}>{TYPE_LABEL[job.type]}</span></td>
                      <td>
                        <div className="td-slots">
                          <div className="slots-bar-bg" style={{width:80}}>
                            <div className="slots-bar-fill" style={{ width:`${Math.min(100,pct)}%`, background: free===0?'#ef4444':free<3?'#f59e0b':'#22c55e' }} />
                          </div>
                          <span className="td-slot-txt">{taken}/{job.totalSlots}</span>
                        </div>
                        <button className="people-btn" onClick={()=>openJobApplicants(job)}>
                          👥 {taken} заявок →
                        </button>
                      </td>
                      <td><span className={'status-dot '+(job.isActive?'active':'inactive')}>{job.isActive?'● Активна':'● Скрыта'}</span></td>
                      <td>
                        <div className="td-actions">
                          <button className="btn-xs" onClick={()=>handleToggleJob(job._id)}>{job.isActive?'🙈':'👁'}</button>
                          <button className="btn-xs danger" onClick={()=>handleDeleteJob(job._id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SCHEDULE */}
      {tab === 'schedule' && (
        <div className="adm-table-wrap">
          <div className="adm-table-head">
            <span>Расписание <span className="badge">{schedule.length}</span></span>
            <Link to="/schedule/add" className="btn btn-primary btn-sm">+ Добавить</Link>
          </div>
          <div className="tbl-scroll">
            <table className="adm-table">
              <thead><tr><th>#</th><th>Занятие</th><th>Преподаватель</th><th>Дата / Время</th><th>Студенты</th><th>Действия</th></tr></thead>
              <tbody>
                {schedule.map((slot, i) => {
                  const enrolled = slot.enrolledStudents?.length || 0;
                  const today = new Date().toISOString().slice(0,10);
                  return (
                    <tr key={slot._id} className={slot.date < today ? 'row-muted' : ''}>
                      <td className="td-num">{i+1}</td>
                      <td>
                        <strong>{slot.subject}</strong>
                        {slot.room && <div className="td-sub">🚪 {slot.room}</div>}
                        {slot.description && <div className="td-sub" style={{maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{slot.description}</div>}
                      </td>
                      <td>
                        <div className="td-user" style={{gap:'.4rem'}}>
                          <div className="td-avatar" style={{background:'#8b5cf618',color:'#8b5cf6'}}>{(slot.teacherName||'?')[0]}</div>
                          <span>{slot.teacherName}</span>
                        </div>
                      </td>
                      <td><strong>{slot.date}</strong><div className="td-sub">{slot.startTime} – {slot.endTime}</div></td>
                      <td>
                        <button className="people-btn" onClick={()=>openSlotStudents(slot)}>
                          👥 {enrolled}/{slot.maxStudents} →
                        </button>
                      </td>
                      <td>
                        <div className="td-actions">
                          <Link to={`/schedule/edit/${slot._id}`} className="btn-xs">✏️</Link>
                          <button className="btn-xs danger" onClick={()=>handleDeleteSlot(slot._id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
