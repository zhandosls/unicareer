import React from 'react';
import { Routes, Route, NavLink, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Jobs from './pages/Jobs';
import AddJob from './pages/AddJob';
import Schedule from './pages/Schedule';
import AddSlot from './pages/AddSlot';
import MySchedule from './pages/MySchedule';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import EmployerForm from './pages/EmployerForm';
import AdminDashboard from './pages/AdminDashboard';
import AuthPage from './pages/AuthPage';

function NavBar() {
  const { user, isAuth, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav className="nav">
      <Link to="/" className="nav-logo">AITU<span>·</span>Career</Link>
      <div className="nav-links">
        <NavLink to="/" end className={({isActive}) => 'nav-link'+(isActive?' active':'')}>
          🏠 <span>Главная</span>
        </NavLink>
        <NavLink to="/jobs" className={({isActive}) => 'nav-link'+(isActive?' active':'')}>
          💼 <span>Вакансии</span>
        </NavLink>
        <NavLink to="/schedule" className={({isActive}) => 'nav-link'+(isActive?' active':'')}>
          📅 <span>Расписание</span>
        </NavLink>
        {isAuth && (
          <NavLink to="/my-schedule" className={({isActive}) => 'nav-link'+(isActive?' active':'')}>
            📆 <span>Мои занятия</span>
          </NavLink>
        )}
        {isAuth && (
          <NavLink to="/notifications" className={({isActive}) => 'nav-link'+(isActive?' active':'')}>
            🔔 <span>Уведомления</span>
          </NavLink>
        )}
        {isAuth && user?.role === 'admin' && (
          <NavLink to="/admin" className={({isActive}) => 'nav-link'+(isActive?' active':'')}>
            ⚙️ <span>Админ</span>
          </NavLink>
        )}
      </div>
      <div className="nav-auth">
        {isAuth ? (
          <div className="nav-user">
            <Link to="/profile" className="nav-user-name" style={{textDecoration:'none'}}>
              {user.role==='student'?'🎓':user.role==='teacher'?'📚':user.role==='admin'?'⚙️':'🏢'} {user.name}
            </Link>
            <button className="btn-logout" onClick={handleLogout}>Выйти</button>
          </div>
        ) : (
          <Link to="/auth" className="btn btn-primary btn-sm">Войти</Link>
        )}
      </div>
    </nav>
  );
}

function AppInner() {
  return (
    <>
      <NavBar />
      <main className="page">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/add" element={<AddJob />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/schedule/add" element={<AddSlot />} />
          <Route path="/schedule/edit/:id" element={<AddSlot />} />
          <Route path="/my-schedule" element={<MySchedule />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/employer" element={<EmployerForm />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
