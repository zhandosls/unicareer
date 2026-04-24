import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { jobService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AddJob() {
  const { user, isAuth } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', type: 'full', salary: '', location: '', skills: '', description: '', totalSlots: 10
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isAuth || user?.role !== 'employer') {
    return (
      <div className="empty">
        <div className="empty-icon">🔒</div>
        <p>Только работодатели могут добавлять вакансии. <Link to="/auth">Войти</Link></p>
      </div>
    );
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await jobService.create({
        ...form,
        totalSlots: Number(form.totalSlots),
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean)
      });
      navigate('/jobs');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <div className="form-card">
        <h2 className="form-title">📋 Новая вакансия</h2>
        <p className="form-sub">Компания: <strong>{user.companyName}</strong></p>

        <form onSubmit={handleSubmit} className="form-body">
          <div className="field">
            <label>Название вакансии *</label>
            <input type="text" value={form.title} onChange={set('title')} placeholder="Frontend Developer" required />
          </div>

          <div className="fields-row">
            <div className="field">
              <label>Тип *</label>
              <select value={form.type} onChange={set('type')}>
                <option value="full">Full-time</option>
                <option value="intern">Стажировка</option>
                <option value="part">Part-time</option>
              </select>
            </div>
            <div className="field">
              <label>Количество мест *</label>
              <input type="number" min="1" max="500" value={form.totalSlots} onChange={set('totalSlots')} required />
            </div>
          </div>

          <div className="field">
            <label>Зарплата</label>
            <input type="text" value={form.salary} onChange={set('salary')} placeholder="400 000 – 700 000 ₸/мес" />
          </div>

          <div className="field">
            <label>Локация</label>
            <input type="text" value={form.location} onChange={set('location')} placeholder="Алматы / Удалённо" />
          </div>

          <div className="field">
            <label>Навыки (через запятую)</label>
            <input type="text" value={form.skills} onChange={set('skills')} placeholder="React, TypeScript, CSS" />
          </div>

          <div className="field">
            <label>Описание вакансии</label>
            <textarea rows={5} value={form.description} onChange={set('description')}
              placeholder="Опишите обязанности, требования и условия..." />
          </div>

          {error && <div className="alert alert-err">⚠️ {error}</div>}

          <div className="form-footer">
            <Link to="/jobs" className="btn btn-outline">Отмена</Link>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? <><span className="spinner" /> Сохранение...</> : '✓ Опубликовать вакансию'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
