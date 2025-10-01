import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Home from './components/Home';
import Login from './components/Login';
import SignUp from './components/SignUp';
import Welcome from './components/Welcome';
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
      if (location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/welcome') {
        navigate('/');
      }
    } else {
      if (location.pathname === '/') {
        navigate('/welcome');
      }
    }
  }, [session, navigate, location.pathname]);

  return (
    <div className="container">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/" element={session ? <Home /> : <Welcome />} />
      </Routes>
    </div>
  );
}

export default App;