import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor'; // Importar el nuevo componente Editor
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };
    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Muestra un loader mientras se verifica la sesión
  }

  return (
    <Router>
      <div className="App">
        <header>
          <nav>
            {!session ? (
              <>
                <Link to="/login">Login</Link> | <Link to="/signup">Sign Up</Link>
              </>
            ) : (
              // Si hay sesión, podríamos mostrar un enlace al Dashboard o el nombre del usuario
              <Link to="/">Dashboard</Link>
            )}
          </nav>
        </header>
        <main>
          <Routes>
            <Route path="/signup" element={!session ? <SignUp /> : <Navigate to="/" />} />
            <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
            <Route
              path="/"
              element={session ? <Dashboard /> : <Navigate to="/login" />}
            />
            {/* Nueva ruta para el editor */}
            <Route
              path="/editor/:projectId"
              element={session ? <Editor /> : <Navigate to="/login" />}
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;