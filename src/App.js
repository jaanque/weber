import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Home from './components/Home';
import Login from './components/Login';
import SignUp from './components/SignUp';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      if (location.pathname === '/login' || location.pathname === '/signup') {
        navigate('/');
      }
    } else {
      if (location.pathname === '/') {
        navigate('/login');
      }
    }
  }, [session, navigate, location.pathname]);

  return (
    <div className="container">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/" element={session ? <Home /> : <Login />} />
      </Routes>
    </div>
  );
}

export default App;