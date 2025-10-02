import React from 'react';
import './Projects.css';

const Projects = ({ projects, loading }) => {
  if (loading) {
    return <div>Loading projects...</div>;
  }

  return (
    <div className="projects-container">
      <div className="projects-header">
        <h2>Your Projects</h2>
      </div>
      {projects.length === 0 ? (
        <p>No projects yet. Click "+ New Project" to get started!</p>
      ) : (
        <div className="project-list">
          {projects.map((project) => (
            <div key={project.id} className="project-item">
              {project.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;