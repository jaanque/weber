import React from 'react';
import { useOutletContext } from 'react-router-dom';
import Projects from './Projects';
import './Home.css';

const Home = () => {
  const { projects, setProjects, loadingProjects } = useOutletContext();

  return (
    <div className="home-container">
      <div className="home-content">
        <Projects projects={projects} setProjects={setProjects} loading={loadingProjects} />
      </div>
    </div>
  );
};

export default Home;