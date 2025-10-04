import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import Projects from './Projects';
import NewProjectModal from './NewProjectModal';
import UserProfile from './UserProfile';
import { FaPlus } from 'react-icons/fa';
import './Home.css';

const Home = () => {
  const { projects, setProjects, loadingProjects, handleProjectAdded } = useOutletContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="home-container">
      {/* Floating UI Elements */}
      <div className="home-floating-ui-top-right">
        <UserProfile />
      </div>

      <div className="home-floating-ui-bottom-right">
        <button onClick={() => setIsModalOpen(true)} className="new-project-button-float" title="New Project">
          <FaPlus size={20} />
        </button>
      </div>

      {/* Main Content */}
      <div className="home-content">
        <Projects projects={projects} setProjects={setProjects} loading={loadingProjects} />
      </div>

      {/* Modal for creating a new project */}
      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProjectAdded={handleProjectAdded}
      />
    </div>
  );
};

export default Home;