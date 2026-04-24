import React, { useState } from 'react';
import { studentService } from '../services/api';

const INIT = { name: '', email: '' };

export default function StudentForm() {
  const [form, setForm]       = useState(INIT);
  const [errs, setErrs]       = useState({});
  const [status, setStatus]   = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim() || form.name.trim().length < 2)
      e.name = 'Имя — минимум 2 символа';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Введите корректный email';
    return e;
  };

  const onChange = e => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setErrs(p => ({ ...p, [e.target.name]: undefined }));
  };

  const onSubmit = async e => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) return setErrs(v);
    setLoading(true); setStatus(null);
    try {
      const res = await studentService.create(form);
      setStatus('ok');
      setMessage(`🎓 RSVP подтверждён для ${res.data.name}! Ждём вас 21 апреля 2026.`);
      setForm(INIT);
    } catch (err) {
      setStatus('err');
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <div className="form-title">RSVP студента</div>
      <p className="form-subtitle">
        Забронируйте место на AITU Career Fair 2026 и встретьтесь с работодателями Алматы лично.
      </p>

      <div className="info-box">
        <span className="info-box-icon">💡</span>
        <div>
          <div className="info-box-title">Совет перед мероприятием</div>
          <div className="info-box-body">
            Просмотрите список вакансий на главной странице и подготовьте резюме.
            На ярмарке можно поговорить с рекрутерами напрямую без собеседования.
          </div>
        </div>
      </div>

      {status === 'ok'  && <div className="alert alert-ok">{message}</div>}
      {status === 'err' && <div className="alert alert-err">⚠️ {message}</div>}

      <div className="form-card">
        <form onSubmit={onSubmit} noValidate>
          <div className="field">
            <label>Полное имя</label>
            <input name="name" value={form.name} onChange={onChange}
              placeholder="Амир Бекжанов" className={errs.name ? 'err' : ''} />
            {errs.name && <div className="field-err">{errs.name}</div>}
          </div>

          <div className="field">
            <label>Email адрес</label>
            <input type="email" name="email" value={form.email} onChange={onChange}
              placeholder="you@student.aitu.edu.kz" className={errs.email ? 'err' : ''} />
            {errs.email && <div className="field-err">{errs.email}</div>}
          </div>

          <button type="submit" className="btn btn-primary"
            style={{width:'100%', justifyContent:'center'}} disabled={loading}>
            {loading ? <><span className="spinner" style={{borderTopColor:'#fff'}} /> Отправка...</> : '🎓 Подтвердить RSVP'}
          </button>
        </form>
      </div>
    </div>
  );
}
