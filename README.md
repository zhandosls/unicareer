# 🎓 AITU Career Fair Platform — MongoDB Edition

Full-stack MVP — AITU Career Fair, **21 апреля 2026, Алматы**

## Стек
| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + React Router + Axios |
| Backend  | Node.js + Express |
| Database | **MongoDB + Mongoose** |

---

## Структура проекта

```
project/
├── backend/
│   ├── .env                  ← настройки (MONGODB_URI, PORT)
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── server.js         ← подключение к MongoDB + запуск
│       ├── models/
│       │   ├── Employer.js   ← Mongoose schema
│       │   ├── Student.js    ← Mongoose schema
│       │   └── seed.js       ← начальные данные (5 компаний)
│       └── routes/
│           ├── employers.js
│           └── students.js
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js        ← прокси /api → localhost:5000
    └── src/
        ├── App.jsx
        ├── index.css         ← светлая тема (Fraunces + Plus Jakarta Sans)
        ├── main.jsx
        ├── services/api.js
        └── pages/
            ├── Home.jsx
            ├── EmployerForm.jsx
            ├── StudentForm.jsx
            └── AdminDashboard.jsx
```

---

## Установка и запуск

### Предварительные требования
- Node.js v18+
- **MongoDB** запущен локально: `mongod` (порт 27017 по умолчанию)

> Или используйте MongoDB Atlas — замените `MONGODB_URI` в `.env`

### 1. Бэкенд

```bash
cd backend
npm install
npm run dev
# API запущен на http://localhost:5000
# MongoDB подключён, 5 компаний засеяны автоматически
```

### 2. Фронтенд

```bash
cd frontend
npm install
npm run dev
# Приложение открыто на http://localhost:3000
```

---

## Переменные окружения (`backend/.env`)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/career_fair
```

Для MongoDB Atlas:
```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxx.mongodb.net/career_fair
```

---

## API

### `GET /api/employers`
```json
{ "success": true, "count": 5, "data": [ ... ] }
```

### `POST /api/employers`
```json
{ "companyName": "Halyk Bank", "email": "hr@halyk.kz", "description": "..." }
```
→ `201 Created` или `400/409` с `{ "success": false, "errors": ["..."] }`

### `GET /api/students`
```json
{ "success": true, "count": 12, "data": [ ... ] }
```

### `POST /api/students`
```json
{ "name": "Амир Бекжанов", "email": "amir@aitu.edu.kz" }
```
→ `201 Created` или `400/409`

### `GET /api/health`
```json
{ "status": "ok", "db": "connected", "time": "2026-04-21T..." }
```

---

## Возможности

- ✅ Светлая тема — Fraunces serif + Plus Jakarta Sans
- ✅ MongoDB + Mongoose (данные сохраняются после перезапуска)
- ✅ Автосид: 5 казахстанских компаний при первом запуске
- ✅ 16 вакансий с фильтрацией (Алматы, 2026)
- ✅ Дата мероприятия: **21 апреля 2026**
- ✅ Валидация + дубликат-чек (email unique)
- ✅ Панель администратора со статистикой и таблицами
- ✅ Все сообщения на русском языке
