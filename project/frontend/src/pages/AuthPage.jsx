import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { value: 'student', label: '🎓 Студент', desc: 'Подавайте заявки на вакансии, записывайтесь на занятия' },
  { value: 'teacher', label: '📚 Преподаватель', desc: 'Создавайте расписание уроков' },
  { value: 'employer', label: '🏢 Работодатель', desc: 'Публикуйте вакансии и находите кандидатов' },
];

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // login | register
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({ name: '', email: '', password: '', companyName: '', department: '', specialty: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      let data;
      if (mode === 'login') {
        data = await authService.login({ email: form.email, password: form.password });
      } else {
        data = await authService.register({ ...form, role });
      }
      login(data);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">AITU<span>·</span>Career</div>
        <div className="auth-tabs">
          <button className={'auth-tab' + (mode === 'login' ? ' active' : '')} onClick={() => { setMode('login'); setError(''); }}>Войти</button>
          <button className={'auth-tab' + (mode === 'register' ? ' active' : '')} onClick={() => { setMode('register'); setError(''); }}>Регистрация</button>
        </div>

        {mode === 'register' && (
          <div className="role-select">
            {ROLES.map(r => (
              <button key={r.value} className={'role-btn' + (role === r.value ? ' active' : '')} onClick={() => setRole(r.value)} type="button">
                <span className="role-icon">{r.label.split(' ')[0]}</span>
                <span className="role-text">
                  <strong>{r.label.split(' ').slice(1).join(' ')}</strong>
                  <small>{r.desc}</small>
                </span>
              </button>
            ))}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="field">
              <label>Полное имя</label>
              <input type="text" value={form.name} onChange={set('name')} placeholder="Иван Иванов" required />
            </div>
          )}
          <div className="field">
            <label>Email</label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="you@aitu.edu.kz" required />
          </div>
          <div className="field">
            <label>Пароль</label>
            <input type="password" value={form.password} onChange={set('password')} placeholder="Минимум 6 символов" required />
          </div>

          {mode === 'register' && role === 'employer' && (
            <>
              <div className="field">
                <label>Название компании</label>
                <input type="text" value={form.companyName} onChange={set('companyName')} placeholder="Kaspi Bank" required />
              </div>
              <div className="field">
                <label>Описание компании</label>
                <input type="text" value={form.companyDescription} onChange={set('companyDescription')} placeholder="Краткое описание" />
              </div>
            </>
          )}
          {mode === 'register' && role === 'teacher' && (
            <div className="field">
              <label>Кафедра / Факультет</label>
              <input type="text" value={form.department} onChange={set('department')} placeholder="Факультет IT" />
            </div>
          )}
          {mode === 'register' && role === 'student' && (
            <div className="field">
              <label>Специальность</label>
              <input type="text" value={form.specialty} onChange={set('specialty')} placeholder="Информационные системы" />
            </div>
          )}

          {error && <div className="alert alert-err">⚠️ {error}</div>}

          <button className="btn btn-primary w-full" type="submit" disabled={loading}>
            {loading ? <><span className="spinner" /> Загрузка...</> : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </button>
        </form>
      </div>
    </div>
  );
}
