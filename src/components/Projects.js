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
      <h2>Your Projects</h2>
      <form onSubmit={handleAddProject} className="add-project-form">
        <input
          type="text"
          placeholder="New project name"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />
        <button type="submit">Add Project</button>
      </form>
      <ul className="project-list">
        {projects.map((project) => (
          <li key={project.id} className="project-item">
            {project.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Projects;