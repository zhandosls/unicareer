import React, { useState } from 'react';
import { employerService } from '../services/api';

const INIT = { companyName: '', email: '', description: '' };

export default function EmployerForm() {
  const [form, setForm]       = useState(INIT);
  const [errs, setErrs]       = useState({});
  const [status, setStatus]   = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.companyName.trim() || form.companyName.trim().length < 2)
      e.companyName = 'Название компании — минимум 2 символа';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Введите корректный email';
    if (!form.description.trim() || form.description.trim().length < 10)
      e.description = 'Описание — минимум 10 символов';
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
      const res = await employerService.create(form);
      setStatus('ok');
      setMessage(`✅ Стенд «${res.data.companyName}» успешно зарегистрирован! До встречи 21 апреля.`);
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
      <div className="form-title">Регистрация стенда</div>
      <p className="form-subtitle">
        Забронируйте стенд на AITU Career Fair 2026 и встретьте лучших выпускников Алматы.
      </p>

      {status === 'ok'  && <div className="alert alert-ok">{message}</div>}
      {status === 'err' && <div className="alert alert-err">⚠️ {message}</div>}

      <div className="form-card">
        <form onSubmit={onSubmit} noValidate>
          <div className="field">
            <label>Название компании</label>
            <input name="companyName" value={form.companyName} onChange={onChange}
              placeholder="напр. Kaspi Bank" className={errs.companyName ? 'err' : ''} />
            {errs.companyName && <div className="field-err">{errs.companyName}</div>}
          </div>

          <div className="field">
            <label>Контактный Email</label>
            <input type="email" name="email" value={form.email} onChange={onChange}
              placeholder="hr@company.kz" className={errs.email ? 'err' : ''} />
            {errs.email && <div className="field-err">{errs.email}</div>}
          </div>

          <div className="field">
            <label>О компании и открытые позиции</label>
            <textarea name="description" value={form.description} onChange={onChange}
              rows={4} placeholder="Расскажите студентам о компании и какие вакансии открыты..."
              className={errs.description ? 'err' : ''} />
            {errs.description && <div className="field-err">{errs.description}</div>}
          </div>

          <button type="submit" className="btn btn-primary"
            style={{width:'100%', justifyContent:'center'}} disabled={loading}>
            {loading ? <><span className="spinner" style={{borderTopColor:'#fff'}} /> Отправка...</> : '🏢 Зарегистрировать стенд'}
          </button>
        </form>
      </div>
    </div>
  );
}
