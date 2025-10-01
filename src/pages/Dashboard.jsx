import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom'; // Importar Link

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching projects:', error);
        } else {
          setProjects(data);
        }
      }
      setLoading(false);
    };

    fetchProjects();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleNewProject = async () => {
    const projectName = prompt('Enter the name for your new project:');
    if (projectName) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('projects')
          .insert([{ name: projectName, user_id: user.id, content: { components: [] } }])
          .select()
          .single();

        if (error) {
          alert('Error creating project: ' + error.message);
        } else if (data) {
          // Redirigir al editor del nuevo proyecto
          navigate(`/editor/${data.id}`);
        }
      }
    }
  };

  return (
    <div>
      <h2>Dashboard</h2>
      <p>Welcome! You are logged in.</p>
      <button onClick={handleLogout}>Logout</button>
      <hr />
      <h3>Your Projects</h3>
      {loading ? (
        <p>Loading projects...</p>
      ) : (
        <ul>
          {projects.map((project) => (
            <li key={project.id}>
              {/* Enlazar cada proyecto a su editor */}
              <Link to={`/editor/${project.id}`}>{project.name}</Link>
            </li>
          ))}
        </ul>
      )}
      <button onClick={handleNewProject}>+ New Project</button>
    </div>
  );
};

export default Dashboard;