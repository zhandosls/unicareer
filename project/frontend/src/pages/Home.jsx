import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { employerService } from '../services/api';

// Event date — 21 April 2026 (today)
const EVENT_DATE = new Date('2026-04-21T10:00:00');

const JOBS = [
  { id:1,  title:'Frontend Developer',         company:'Kaspi Bank',           type:'full',   salary:'400 000–700 000 ₸/мес', loc:'Алматы, ул. Кунаева 8',       skills:['React','TypeScript','CSS'] },
  { id:2,  title:'Backend Developer (Node.js)', company:'Kolesa Group',         type:'full',   salary:'500 000–800 000 ₸/мес', loc:'Алматы, мкр. Алатау',        skills:['Node.js','PostgreSQL','Docker'] },
  { id:3,  title:'iOS Developer (Стажёр)',      company:'Jusan Bank',           type:'intern', salary:'150 000–200 000 ₸/мес', loc:'Алматы, пр. Аль-Фараби 5',   skills:['Swift','UIKit','Xcode'] },
  { id:4,  title:'Data Analyst',                company:'Beeline Kazakhstan',   type:'full',   salary:'350 000–550 000 ₸/мес', loc:'Алматы, пр. Достык 180',     skills:['Python','SQL','Power BI'] },
  { id:5,  title:'DevOps Engineer',             company:'EPAM Systems',         type:'full',   salary:'600 000–1 000 000 ₸/мес',loc:'Алматы, ул. Желтоқсан 115', skills:['Kubernetes','AWS','CI/CD'] },
  { id:6,  title:'ML Engineer (Part-time)',     company:'Kaspi Bank',           type:'part',   salary:'300 000–450 000 ₸/мес', loc:'Алматы / Удалённо',          skills:['Python','TensorFlow','MLOps'] },
  { id:7,  title:'QA Engineer',                 company:'Kolesa Group',         type:'full',   salary:'280 000–420 000 ₸/мес', loc:'Алматы, мкр. Алатау',        skills:['Selenium','Postman','Jira'] },
  { id:8,  title:'Android Developer (Стажёр)',  company:'Jusan Bank',           type:'intern', salary:'150 000–180 000 ₸/мес', loc:'Алматы, пр. Аль-Фараби 5',   skills:['Kotlin','Jetpack','Android'] },
  { id:9,  title:'UX/UI Designer',              company:'EPAM Systems',         type:'full',   salary:'350 000–600 000 ₸/мес', loc:'Алматы / Удалённо',          skills:['Figma','Prototyping','Design Systems'] },
  { id:10, title:'Специалист по кибербезопасности', company:'Beeline Kazakhstan', type:'full', salary:'450 000–750 000 ₸/мес', loc:'Алматы, пр. Достык 180',     skills:['Pen Testing','SIEM','SOC'] },
  { id:11, title:'1C Разработчик',              company:'Jusan Bank',           type:'full',   salary:'300 000–500 000 ₸/мес', loc:'Алматы, пр. Аль-Фараби 5',   skills:['1C','BSP','ERP'] },
  { id:12, title:'Product Manager (Стажёр)',    company:'Kaspi Bank',           type:'intern', salary:'180 000–220 000 ₸/мес', loc:'Алматы, ул. Кунаева 8',      skills:['Agile','Analytics','Roadmap'] },
  { id:13, title:'Java Backend Developer',      company:'Freedom Finance',      type:'full',   salary:'550 000–900 000 ₸/мес', loc:'Алматы, пр. Аль-Фараби 77', skills:['Java','Spring','Kafka'] },
  { id:14, title:'Golang Developer',            company:'Halyk Bank',           type:'full',   salary:'600 000–950 000 ₸/мес', loc:'Алматы, пр. Абая 109',      skills:['Go','gRPC','PostgreSQL'] },
  { id:15, title:'Data Engineer (Стажёр)',      company:'Kolesa Group',         type:'intern', salary:'160 000–210 000 ₸/мес', loc:'Алматы, мкр. Алатау',        skills:['Python','Spark','Airflow'] },
  { id:16, title:'React Native Developer',      company:'Kaspi Bank',           type:'full',   salary:'500 000–800 000 ₸/мес', loc:'Алматы, ул. Кунаева 8',      skills:['React Native','Redux','iOS/Android'] },
];

const TYPE_LABEL = { full: 'Full-time', intern: 'Стажировка', part: 'Part-time' };
const TYPE_CLASS  = { full: 'jt-full',  intern: 'jt-intern',  part: 'jt-part' };

function formatEventDate(d) {
  return d.toLocaleDateString('ru-KZ', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function Home() {
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    employerService.getAll()
      .then(res => setEmployers(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? JOBS : JOBS.filter(j => j.type === filter);

  return (
    <div>
      {/* ── HERO ── */}
      <div className="hero">
        <div className="hero-inner">
          <div className="live-badge">
            <span className="live-dot" />
            Регистрация открыта
          </div>

          <h1>AITU Career Fair<br /><em>Алматы 2026</em></h1>

          <p className="hero-sub">
            Познакомьтесь с ведущими работодателями Казахстана.
            Стажировки, full-time и part-time вакансии — всё в одном месте.
          </p>

          <div className="event-chips">
            <div className="chip">
              <span className="chip-icon">📅</span>
              <div>
                <span className="chip-label">Дата</span>
                <span className="chip-val">{formatEventDate(EVENT_DATE)}</span>
              </div>
            </div>
            <div className="chip">
              <span className="chip-icon">🕙</span>
              <div>
                <span className="chip-label">Время</span>
                <span className="chip-val">10:00 – 17:00</span>
              </div>
            </div>
            <div className="chip">
              <span className="chip-icon">📍</span>
              <div>
                <span className="chip-label">Место</span>
                <span className="chip-val">AITU, Алматы</span>
              </div>
            </div>
            <div className="chip">
              <span className="chip-icon">🏢</span>
              <div>
                <span className="chip-label">Компании</span>
                <span className="chip-val">{employers.length} зарегистрировано</span>
              </div>
            </div>
            <div className="chip">
              <span className="chip-icon">💼</span>
              <div>
                <span className="chip-label">Вакансии</span>
                <span className="chip-val">{JOBS.length} открытых позиций</span>
              </div>
            </div>
          </div>

          <div className="hero-cta">
            <Link to="/rsvp" className="btn btn-primary">🎓 Зарегистрироваться (RSVP)</Link>
            <Link to="/employer" className="btn btn-outline">🏢 Зарегистрировать стенд</Link>
          </div>
        </div>
      </div>

      {/* ── EMPLOYERS ── */}
      <div className="section">
        <div className="section-head">
          <span className="section-title">Участвующие компании</span>
          <span className="badge">{employers.length} стендов</span>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /> Загрузка...</div>
        ) : employers.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🏢</div>
            <p>Пока никто не зарегистрировался. <Link to="/employer" style={{color:'var(--blue)'}}>Будьте первыми!</Link></p>
          </div>
        ) : (
          <div className="employers-grid">
            {employers.map(emp => (
              <div className="employer-card" key={emp._id || emp.id}>
                <div className="emp-avatar">{emp.companyName[0]}</div>
                <div className="emp-name">{emp.companyName}</div>
                <div className="emp-email">{emp.email}</div>
                <div className="emp-desc">{emp.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── JOBS ── */}
      <div className="jobs-strip">
        <div className="jobs-inner">
          <div className="section-head">
            <span className="section-title">🔥 Вакансии — Алматы 2026</span>
            <span className="badge">{JOBS.length} позиций</span>
          </div>
          <p className="jobs-sub">
            Актуальные позиции от компаний-участников. Приходите на ярмарку и говорите с рекрутерами напрямую.
          </p>

          <div className="filter-row">
            {[['all','Все'], ['full','Full-time'], ['intern','Стажировка'], ['part','Part-time']].map(([k, lbl]) => (
              <button key={k} className={'filter-btn' + (filter === k ? ' on' : '')} onClick={() => setFilter(k)}>
                {lbl}
              </button>
            ))}
          </div>

          <div className="jobs-grid">
            {filtered.map(job => (
              <div className="job-card" key={job.id}>
                <span className={`job-type-tag ${TYPE_CLASS[job.type]}`}>{TYPE_LABEL[job.type]}</span>
                <div className="job-title">{job.title}</div>
                <div className="job-company">{job.company}</div>
                <div className="job-salary">{job.salary}</div>
                <div className="job-loc">📍 {job.loc}</div>
                <div className="job-skills">
                  {job.skills.map(s => <span key={s} className="skill-pill">{s}</span>)}
                </div>
                <Link to="/rsvp">
                  <button className="job-rsvp-btn">Подать заявку →</button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
