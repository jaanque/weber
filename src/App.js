import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Home from './components/Home';
import Login from './components/Login';
import SignUp from './components/SignUp';
import Sidebar from './components/Sidebar';
import NewProjectModal from './components/NewProjectModal';
import Canvas from './components/Canvas';
import './App.css';

const AuthenticatedLayout = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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

    if (!isCanvasView) {
      fetchProjects();
    } else {
      setLoadingProjects(false);
    }
  }, [isCanvasView]);

  const handleProjectAdded = (newProject) => {
    setProjects((currentProjects) => [newProject, ...currentProjects]);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className={`app-layout ${isCanvasView ? 'canvas-mode' : ''} ${!isCanvasView && isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {!isCanvasView && (
        <Sidebar
          onNewProjectClick={() => setIsModalOpen(true)}
          isCollapsed={isSidebarCollapsed}
          toggleSidebar={toggleSidebar}
        />
      )}
      <main className="main-content">
        <Outlet context={{ projects, setProjects, loadingProjects }} />
      </main>
      {!isCanvasView && (
        <NewProjectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onProjectAdded={handleProjectAdded}
        />
      )}
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