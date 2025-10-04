import React from 'react';
import { Link } from 'react-router-dom';
import { FaFolder } from 'react-icons/fa';
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
            <Link to={`/projects/${project.id}`} key={project.id} className="project-item-link">
              <div className="project-item">
                <span className="project-icon"><FaFolder /></span>
                <span className="project-name">{project.name}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;