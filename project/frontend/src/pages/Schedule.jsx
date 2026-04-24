import React, { useState, useEffect } from 'react';
import { scheduleService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const DAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

function getWeekDates(base) {
  const d = new Date(base);
  const day = d.getDay();
  const mon = new Date(d); mon.setDate(d.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(mon); dd.setDate(mon.getDate() + i);
    return dd;
  });
}

function toISO(d) {
  return d.toISOString().slice(0, 10);
}

function SlotCard({ slot, userId, onEnroll, onUnenroll, busy }) {
  const enrolled = slot.enrolledStudents?.some(s => s.userId === userId || s.email === userId);
  const free = slot.availableSpots ?? (slot.maxStudents - (slot.enrolledStudents?.length || 0));
  const full = free <= 0 && !enrolled;

  return (
    <div className={'slot-card' + (enrolled ? ' enrolled' : '') + (full ? ' full' : '')}>
      <div className="slot-time">{slot.startTime} – {slot.endTime}</div>
      <div className="slot-subject">{slot.subject}</div>
      <div className="slot-teacher">👤 {slot.teacherName}</div>
      {slot.room && <div className="slot-room">🚪 {slot.room}</div>}
      <div className="slot-spots">
        {enrolled ? <span className="spot-enrolled">✓ Вы записаны</span>
          : full ? <span className="spot-full">Мест нет</span>
          : <span className="spot-free">{free} мест</span>}
      </div>
      {userId && (
        enrolled ? (
          <button className="slot-btn cancel" onClick={() => onUnenroll(slot._id)} disabled={busy[slot._id]}>
            {busy[slot._id] ? '...' : 'Отменить запись'}
          </button>
        ) : !full && (
          <button className="slot-btn" onClick={() => onEnroll(slot._id)} disabled={busy[slot._id]}>
            {busy[slot._id] ? '...' : 'Записаться'}
          </button>
        )
      )}
    </div>
  );
}

export default function Schedule() {
  const { user, isAuth } = useAuth();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekBase, setWeekBase] = useState(new Date());
  const [busy, setBusy] = useState({});
  const [toast, setToast] = useState('');

  const week = getWeekDates(weekBase);

  const fetchSlots = () => {
    setLoading(true);
    scheduleService.getAll()
      .then(r => setSlots(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSlots(); }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleEnroll = async (id) => {
    if (!isAuth) return showToast('Войдите, чтобы записаться');
    setBusy(b => ({ ...b, [id]: true }));
    try {
      const r = await scheduleService.enroll(id);
      showToast(r.message || 'Вы записаны!');
      fetchSlots();
    } catch (err) { showToast(err.message); }
    finally { setBusy(b => ({ ...b, [id]: false })); }
  };

  const handleUnenroll = async (id) => {
    setBusy(b => ({ ...b, [id]: true }));
    try {
      const r = await scheduleService.unenroll(id);
      showToast(r.message || 'Запись отменена');
      fetchSlots();
    } catch (err) { showToast(err.message); }
    finally { setBusy(b => ({ ...b, [id]: false })); }
  };

  const prevWeek = () => { const d = new Date(weekBase); d.setDate(d.getDate() - 7); setWeekBase(d); };
  const nextWeek = () => { const d = new Date(weekBase); d.setDate(d.getDate() + 7); setWeekBase(d); };
  const toToday = () => setWeekBase(new Date());

  const slotsForDay = (date) => {
    const iso = toISO(date);
    return slots.filter(s => s.date === iso).sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const today = toISO(new Date());

  return (
    <div>
      {toast && <div className="toast">{toast}</div>}

      <div className="page-header">
        <div>
          <h2 className="page-title">📅 Расписание занятий</h2>
          <p className="page-sub">Выбирайте удобное время и записывайтесь на занятия</p>
        </div>
        {isAuth && user?.role === 'teacher' && (
          <Link to="/schedule/add" className="btn btn-primary">+ Добавить занятие</Link>
        )}
      </div>

      {/* Week nav */}
      <div className="week-nav">
        <button className="week-btn" onClick={prevWeek}>‹</button>
        <button className="week-today-btn" onClick={toToday}>Сегодня</button>
        <span className="week-label">
          {MONTHS[week[0].getMonth()]} {week[0].getFullYear()}
        </span>
        <button className="week-btn" onClick={nextWeek}>›</button>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /> Загрузка расписания...</div>
      ) : (
        <div className="calendar-grid">
          {week.map((date, i) => {
            const iso = toISO(date);
            const daySlots = slotsForDay(date);
            const isToday = iso === today;
            return (
              <div key={iso} className={'cal-day' + (isToday ? ' today' : '')}>
                <div className="cal-day-header">
                  <span className="cal-day-name">{DAYS[date.getDay()]}</span>
                  <span className={'cal-day-num' + (isToday ? ' today' : '')}>{date.getDate()}</span>
                </div>
                <div className="cal-day-slots">
                  {daySlots.length === 0 ? (
                    <div className="cal-empty">—</div>
                  ) : daySlots.map(slot => (
                    <SlotCard
                      key={slot._id}
                      slot={slot}
                      userId={user?.id}
                      onEnroll={handleEnroll}
                      onUnenroll={handleUnenroll}
                      busy={busy}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
