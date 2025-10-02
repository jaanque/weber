import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './Projects.css';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching projects:', error);
      } else {
        setProjects(data);
      }
    }
    setLoading(false);
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('projects')
        .insert([{ name: projectName, user_id: user.id }])
        .select();

      if (error) {
        console.error('Error adding project:', error);
      } else if (data) {
        setProjects([...projects, ...data]);
        setProjectName('');
      }
    }
  };

  if (loading) {
    return <div>Loading projects...</div>;
  }

  return (
    <div className="projects-container">
      <div className="projects-header">
        <h2>Your Projects</h2>
      </div>
      <form onSubmit={handleAddProject} className="add-project-form">
        <input
          type="text"
          placeholder="Start a new project"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />
        <button type="submit">New Project</button>
      </form>
      <div className="project-list">
        {projects.map((project) => (
          <div key={project.id} className="project-item">
            {project.name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Projects;