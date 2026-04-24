import React, { useState, useEffect } from 'react';
import { scheduleService, jobService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('ru-KZ', { weekday: 'short', day: 'numeric', month: 'long' });
}

function groupByDate(slots) {
  const map = {};
  for (const s of slots) {
    if (!map[s.date]) map[s.date] = [];
    map[s.date].push(s);
  }
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
}

export default function MySchedule() {
  const { user, isAuth } = useAuth();
  const [slots, setSlots] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loadingS, setLoadingS] = useState(true);
  const [loadingJ, setLoadingJ] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [unenrollingId, setUnenrollingId] = useState(null);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchSlots = () => {
    setLoadingS(true);
    scheduleService.getMy()
      .then(r => setSlots(r.data || []))
      .catch(() => {})
      .finally(() => setLoadingS(false));
  };

  const fetchJobs = () => {
    if (!user) return;
    setLoadingJ(true);
    const fn = user.role === 'employer' ? jobService.myPostings : jobService.myApplications;
    fn()
      .then(r => setJobs(r.data || []))
      .catch(() => {})
      .finally(() => setLoadingJ(false));
  };

  useEffect(() => {
    if (isAuth) { fetchSlots(); fetchJobs(); }
  }, [isAuth]);

  const handleDeleteSlot = async (id) => {
    if (!window.confirm('Удалить занятие?')) return;
    setDeletingId(id);
    try {
      await scheduleService.delete(id);
      showToast('Занятие удалено');
      fetchSlots();
    } catch (err) { showToast(err.message); }
    finally { setDeletingId(null); }
  };

  const handleUnenroll = async (id) => {
    setUnenrollingId(id);
    try {
      await scheduleService.unenroll(id);
      showToast('Запись отменена');
      fetchSlots();
    } catch (err) { showToast(err.message); }
    finally { setUnenrollingId(null); }
  };

  if (!isAuth) {
    return (
      <div className="empty">
        <div className="empty-icon">🔒</div>
        <p>Войдите, чтобы видеть свои занятия. <Link to="/auth">Войти</Link></p>
      </div>
    );
  }

  const grouped = groupByDate(slots);
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = grouped.filter(([d]) => d >= today);
  const past = grouped.filter(([d]) => d < today);

  return (
    <div>
      {toast && <div className="toast">{toast}</div>}

      <div className="page-header">
        <div>
          <h2 className="page-title">📆 Мои занятия</h2>
          <p className="page-sub">
            {user.role === 'teacher' ? 'Ваше расписание уроков' :
             user.role === 'student' ? 'Ваши записи на занятия' : 'Ваши данные'}
          </p>
        </div>
        {user.role === 'teacher' && (
          <Link to="/schedule/add" className="btn btn-primary">+ Добавить занятие</Link>
        )}
      </div>

      {/* SCHEDULE SECTION */}
      <div className="my-section">
        <div className="my-section-head">
          <span>📅 Расписание</span>
          <span className="badge">{slots.length} занятий</span>
        </div>

        {loadingS ? (
          <div className="loading"><div className="spinner" /> Загрузка...</div>
        ) : slots.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📅</div>
            <p>
              {user.role === 'teacher'
                ? <><Link to="/schedule/add">Добавьте первое занятие</Link></>
                : <><Link to="/schedule">Запишитесь на занятие в расписании</Link></>}
            </p>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div className="slot-group">
                <div className="slot-group-label">Предстоящие</div>
                {upcoming.map(([date, daySlots]) => (
                  <div key={date} className="slot-day-block">
                    <div className="slot-day-title">{fmtDate(date)}</div>
                    {daySlots.map(slot => (
                      <div key={slot._id} className="my-slot-row">
                        <div className="my-slot-time">{slot.startTime} – {slot.endTime}</div>
                        <div className="my-slot-info">
                          <strong>{slot.subject}</strong>
                          {user.role === 'student' && <span className="my-slot-teacher">👤 {slot.teacherName}</span>}
                          {slot.room && <span className="my-slot-room">🚪 {slot.room}</span>}
                          {user.role === 'teacher' && (
                            <span className="my-slot-spots">
                              👥 {slot.enrolledStudents?.length || 0}/{slot.maxStudents} студентов
                            </span>
                          )}
                        </div>
                        <div className="my-slot-actions">
                          {user.role === 'teacher' ? (
                            <>
                              <Link to={`/schedule/edit/${slot._id}`} className="btn-ghost-sm">✏️</Link>
                              <button className="btn-ghost-sm danger" onClick={() => handleDeleteSlot(slot._id)} disabled={deletingId === slot._id}>
                                {deletingId === slot._id ? '...' : '🗑️'}
                              </button>
                            </>
                          ) : (
                            <button className="btn-ghost-sm danger" onClick={() => handleUnenroll(slot._id)} disabled={unenrollingId === slot._id}>
                              {unenrollingId === slot._id ? '...' : 'Отменить'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
            {past.length > 0 && (
              <div className="slot-group">
                <div className="slot-group-label muted">Прошедшие</div>
                {past.map(([date, daySlots]) => (
                  <div key={date} className="slot-day-block muted">
                    <div className="slot-day-title">{fmtDate(date)}</div>
                    {daySlots.map(slot => (
                      <div key={slot._id} className="my-slot-row muted">
                        <div className="my-slot-time">{slot.startTime} – {slot.endTime}</div>
                        <div className="my-slot-info"><strong>{slot.subject}</strong></div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* JOBS SECTION */}
      {(user.role === 'student' || user.role === 'employer') && (
        <div className="my-section">
          <div className="my-section-head">
            <span>{user.role === 'employer' ? '📋 Мои вакансии' : '💼 Мои заявки на вакансии'}</span>
            <span className="badge">{jobs.length}</span>
          </div>
          {loadingJ ? (
            <div className="loading"><div className="spinner" /></div>
          ) : jobs.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">💼</div>
              <p>{user.role === 'employer'
                ? <><Link to="/jobs/add">Добавьте вакансию</Link></>
                : <><Link to="/jobs">Найдите вакансии</Link></>}
              </p>
            </div>
          ) : (
            <div className="my-jobs-list">
              {jobs.map(job => {
                const free = (job.freeSlots ?? (job.totalSlots - (job.applicants?.length || 0)));
                return (
                  <div key={job._id} className="my-job-row">
                    <div className="my-job-info">
                      <strong>{job.title}</strong>
                      <span className="my-job-company">{job.company}</span>
                      {job.salary && <span className="my-job-salary">{job.salary}</span>}
                    </div>
                    <div className="my-job-slots">
                      <span className={free > 0 ? 'slot-ok' : 'slot-none'}>
                        {free > 0 ? `${free} мест` : 'Мест нет'}
                      </span>
                      <span className="slot-total">{job.applicants?.length || 0}/{job.totalSlots}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
