import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { jobService, scheduleService } from '../services/api';
import { Link } from 'react-router-dom';

function timeAgo(iso) {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60)    return 'только что';
  if (diff < 3600)  return `${Math.floor(diff/60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff/3600)} ч назад`;
  return `${Math.floor(diff/86400)} дн назад`;
}

export default function Notifications() {
  const { user, isAuth } = useAuth();
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuth) { setLoading(false); return; }
    const fetch = async () => {
      const notifs = [];
      try {
        // Для студента — его заявки и записи
        if (user.role === 'student') {
          const [jRes, sRes] = await Promise.all([
            jobService.myApplications().catch(() => ({ data: [] })),
            scheduleService.getMy().catch(() => ({ data: [] })),
          ]);
          for (const job of (jRes.data || [])) {
            const myApp = job.applicants?.find(a => a.email === user.email || a.userId === user.id);
            notifs.push({
              id: job._id + '-job', icon:'💼', color:'#3b82f6',
              title: `Заявка подана: ${job.title}`,
              sub: `🏢 ${job.company} · ${job.freeSlots ?? (job.totalSlots - job.applicants.length)} мест осталось`,
              time: myApp?.appliedAt,
              to: '/my-schedule',
            });
          }
          for (const slot of (sRes.data || [])) {
            const myEnroll = slot.enrolledStudents?.find(s => s.email === user.email || s.userId === user.id);
            notifs.push({
              id: slot._id + '-slot', icon:'📅', color:'#8b5cf6',
              title: `Запись: ${slot.subject}`,
              sub: `${slot.date} ${slot.startTime}–${slot.endTime} · 👤 ${slot.teacherName}`,
              time: myEnroll?.enrolledAt,
              to: '/my-schedule',
            });
          }
        }
        // Для работодателя — их вакансии с новыми заявками
        if (user.role === 'employer') {
          const jRes = await jobService.myPostings().catch(() => ({ data: [] }));
          for (const job of (jRes.data || [])) {
            if (job.applicants?.length > 0) {
              notifs.push({
                id: job._id + '-app', icon:'📋', color:'#10b981',
                title: `${job.applicants.length} заявок на «${job.title}»`,
                sub: `Мест занято: ${job.applicants.length}/${job.totalSlots}`,
                time: job.applicants[job.applicants.length-1]?.appliedAt,
                to: '/my-schedule',
              });
            }
          }
        }
        // Для преподавателя — записи студентов
        if (user.role === 'teacher') {
          const sRes = await scheduleService.getMy().catch(() => ({ data: [] }));
          for (const slot of (sRes.data || [])) {
            if (slot.enrolledStudents?.length > 0) {
              notifs.push({
                id: slot._id + '-enr', icon:'🎓', color:'#f59e0b',
                title: `${slot.enrolledStudents.length} студентов записались на «${slot.subject}»`,
                sub: `${slot.date} · Свободно: ${slot.availableSpots ?? (slot.maxStudents - slot.enrolledStudents.length)} мест`,
                time: slot.enrolledStudents[slot.enrolledStudents.length-1]?.enrolledAt,
                to: '/my-schedule',
              });
            }
          }
        }
      } catch {}
      notifs.sort((a, b) => new Date(b.time||0) - new Date(a.time||0));
      setItems(notifs);
      setLoading(false);
    };
    fetch();
  }, [isAuth, user]);

  if (!isAuth) return (
    <div className="empty">
      <div className="empty-icon">🔒</div>
      <p>Войдите, чтобы видеть уведомления. <Link to="/auth">Войти</Link></p>
    </div>
  );

  return (
    <div style={{ maxWidth: 640, margin:'0 auto' }}>
      <div className="page-header">
        <div>
          <h2 className="page-title">🔔 Уведомления</h2>
          <p className="page-sub">Ваша активность на платформе</p>
        </div>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /> Загрузка...</div>
      ) : items.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🔔</div>
          <p>Пока нет уведомлений. {user.role === 'student' && <><Link to="/jobs">Подайте заявку на вакансию</Link> или <Link to="/schedule">запишитесь на занятие</Link>.</>}</p>
        </div>
      ) : (
        <div className="notif-list">
          {items.map(n => (
            <Link to={n.to} key={n.id} className="notif-item">
              <div className="notif-icon" style={{ background: n.color+'18', color: n.color }}>{n.icon}</div>
              <div className="notif-body">
                <div className="notif-title">{n.title}</div>
                <div className="notif-sub">{n.sub}</div>
              </div>
              <div className="notif-time">{timeAgo(n.time)}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
