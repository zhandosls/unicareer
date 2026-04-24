import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/api';
import { Link } from 'react-router-dom';

const ROLE_INFO = {
  student:  { icon:'🎓', label:'Студент',       color:'#3b82f6' },
  teacher:  { icon:'📚', label:'Преподаватель', color:'#8b5cf6' },
  employer: { icon:'🏢', label:'Работодатель',  color:'#f59e0b' },
  admin:    { icon:'⚙️', label:'Администратор', color:'#ef4444' },
};

export default function Profile() {
  const { user, login, isAuth } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    department: user?.department || '',
    specialty: user?.specialty || '',
    companyDescription: user?.companyDescription || '',
    password: '',
    passwordConfirm: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]     = useState('');

  if (!isAuth) return (
    <div className="empty">
      <div className="empty-icon">🔒</div>
      <p>Войдите, чтобы просматривать профиль. <Link to="/auth">Войти</Link></p>
    </div>
  );

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const role = ROLE_INFO[user.role] || ROLE_INFO.student;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (form.password && form.password !== form.passwordConfirm) {
      return setError('Пароли не совпадают');
    }
    setLoading(true);
    try {
      const payload = { name: form.name };
      if (user.role === 'teacher')  payload.department = form.department;
      if (user.role === 'student')  payload.specialty  = form.specialty;
      if (user.role === 'employer') payload.companyDescription = form.companyDescription;
      if (form.password) payload.password = form.password;
      const r = await profileService.update(payload);
      // update stored user
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      const updated = { ...stored, ...r.user };
      login({ token: localStorage.getItem('token'), user: updated });
      setSuccess('Профиль обновлён!');
      setForm(f => ({ ...f, password: '', passwordConfirm: '' }));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="form-page">
      <div className="form-card">
        {/* Avatar block */}
        <div className="profile-hero">
          <div className="profile-avatar" style={{ background: role.color + '18', color: role.color }}>
            {(user.name||'?')[0]}
          </div>
          <div>
            <div className="profile-name">{user.name}</div>
            <div className="profile-email">{user.email}</div>
            <span className="role-badge" style={{ background: role.color+'18', color: role.color, marginTop:'.4rem', display:'inline-block' }}>
              {role.icon} {role.label}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="form-body" style={{ marginTop:'1.5rem' }}>
          <div className="field">
            <label>Полное имя</label>
            <input type="text" value={form.name} onChange={set('name')} required />
          </div>

          <div className="field">
            <label>Email <span style={{color:'var(--muted)',fontSize:'.8rem'}}>(нельзя изменить)</span></label>
            <input type="email" value={user.email} disabled style={{ opacity:.6 }} />
          </div>

          {user.role === 'teacher' && (
            <div className="field">
              <label>Кафедра / Факультет</label>
              <input type="text" value={form.department} onChange={set('department')} placeholder="Факультет IT" />
            </div>
          )}
          {user.role === 'student' && (
            <div className="field">
              <label>Специальность</label>
              <input type="text" value={form.specialty} onChange={set('specialty')} placeholder="Информационные системы" />
            </div>
          )}
          {user.role === 'employer' && (
            <div className="field">
              <label>О компании</label>
              <textarea rows={3} value={form.companyDescription} onChange={set('companyDescription')} placeholder="Краткое описание вашей компании..." />
            </div>
          )}

          <hr style={{ border:'none', borderTop:'1px solid var(--border)', margin:'.5rem 0' }} />
          <div style={{ fontSize:'.85rem', fontWeight:700, color:'var(--muted)', marginBottom:'-.25rem' }}>Смена пароля (необязательно)</div>

          <div className="fields-row">
            <div className="field">
              <label>Новый пароль</label>
              <input type="password" value={form.password} onChange={set('password')} placeholder="Минимум 6 символов" />
            </div>
            <div className="field">
              <label>Повторите пароль</label>
              <input type="password" value={form.passwordConfirm} onChange={set('passwordConfirm')} placeholder="Ещё раз" />
            </div>
          </div>

          {error   && <div className="alert alert-err">⚠️ {error}</div>}
          {success && <div className="alert alert-ok">✓ {success}</div>}

          <div className="form-footer">
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? <><span className="spinner" /> Сохранение...</> : '✓ Сохранить изменения'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
