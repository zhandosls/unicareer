import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { scheduleService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const TIMES = [];
for (let h = 7; h <= 21; h++) {
  TIMES.push(`${String(h).padStart(2,'0')}:00`);
  TIMES.push(`${String(h).padStart(2,'0')}:30`);
}

export default function AddSlot() {
  const { user, isAuth } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams(); // edit mode if id present
  const [form, setForm] = useState({
    subject: '', date: '', startTime: '09:00', endTime: '10:30',
    maxStudents: 30, room: '', description: ''
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      scheduleService.getAll()
        .then(r => {
          const slot = r.data?.find(s => s._id === id);
          if (slot) setForm({
            subject: slot.subject, date: slot.date,
            startTime: slot.startTime, endTime: slot.endTime,
            maxStudents: slot.maxStudents, room: slot.room || '', description: slot.description || ''
          });
        })
        .finally(() => setFetching(false));
    }
  }, [id]);

  if (!isAuth || user?.role !== 'teacher') {
    return (
      <div className="empty">
        <div className="empty-icon">🔒</div>
        <p>Только преподаватели могут управлять расписанием. <Link to="/auth">Войти</Link></p>
      </div>
    );
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (id) {
        await scheduleService.update(id, form);
      } else {
        await scheduleService.create({ ...form, maxStudents: Number(form.maxStudents) });
      }
      navigate('/my-schedule');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div className="form-page">
      <div className="form-card">
        <h2 className="form-title">{id ? '✏️ Редактировать занятие' : '📚 Новое занятие'}</h2>
        <p className="form-sub">Преподаватель: <strong>{user.name}</strong></p>

        <form onSubmit={handleSubmit} className="form-body">
          <div className="field">
            <label>Предмет *</label>
            <input type="text" value={form.subject} onChange={set('subject')} placeholder="Алгебра / Программирование / ..." required />
          </div>

          <div className="field">
            <label>Дата *</label>
            <input type="date" value={form.date} onChange={set('date')} required min={new Date().toISOString().slice(0,10)} />
          </div>

          <div className="fields-row">
            <div className="field">
              <label>Начало *</label>
              <select value={form.startTime} onChange={set('startTime')}>
                {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Конец *</label>
              <select value={form.endTime} onChange={set('endTime')}>
                {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="fields-row">
            <div className="field">
              <label>Макс. студентов</label>
              <input type="number" min="1" max="200" value={form.maxStudents} onChange={set('maxStudents')} />
            </div>
            <div className="field">
              <label>Аудитория</label>
              <input type="text" value={form.room} onChange={set('room')} placeholder="304-A" />
            </div>
          </div>

          <div className="field">
            <label>Описание / Тема</label>
            <textarea rows={3} value={form.description} onChange={set('description')} placeholder="Тема урока, что нужно взять с собой..." />
          </div>

          {error && <div className="alert alert-err">⚠️ {error}</div>}

          <div className="form-footer">
            <Link to="/my-schedule" className="btn btn-outline">Отмена</Link>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? <><span className="spinner" /> Сохранение...</> : id ? '✓ Сохранить' : '✓ Создать занятие'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
