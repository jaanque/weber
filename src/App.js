import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Home from './components/Home';
import Login from './components/Login';
import SignUp from './components/SignUp';
import Canvas from './components/Canvas';
import './App.css';

// The AuthenticatedLayout now only fetches data and provides it via context.
// All layout logic (like sidebars or floating buttons) is delegated to the child routes (Home, Canvas).
const AuthenticatedLayout = () => {
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const location = useLocation();
  const isCanvasView = location.pathname.startsWith('/projects/');

  useEffect(() => {
    const fetchProjects = async () => {
      setLoadingProjects(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching projects:', error);
        } else {
          setProjects(data);
        }
      }
      setLoadingProjects(false);
    };

    // We only fetch projects when we are on a page that needs them, like the home page.
    if (!isCanvasView) {
      fetchProjects();
    } else {
      setProjects([]); // Clear projects when on canvas view to avoid stale data
      setLoadingProjects(false);
    }
  }, [isCanvasView]);

  const handleProjectAdded = (newProject) => {
    setProjects((currentProjects) => [newProject, ...currentProjects]);
  };

  return (
    <div className="app-layout">
      {/* The main content area now takes up the full space */}
      <main className="main-content">
        {/* Pass down project management functions to children (Home.js) */}
        <Outlet context={{ projects, setProjects, loadingProjects, handleProjectAdded }} />
      </main>
    </div>
  );
};

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
        <Route path="/signup" element={!session ? <SignUp /> : <Navigate to="/" />} />
        <Route element={session ? <AuthenticatedLayout /> : <Navigate to="/login" />}>
          <Route path="/" element={<Home />} />
          <Route path="/projects/:projectId" element={<Canvas />} />
        </Route>
      </Routes>
    </DndProvider>
  );
}

export default App;