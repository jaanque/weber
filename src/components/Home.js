import React from 'react';
import Projects from './Projects';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <div className="home-content">
        <Projects />
      </div>
    </div>
  );
};

export default Home;