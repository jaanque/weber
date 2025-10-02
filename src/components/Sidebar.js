import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Sidebar.css';

const Sidebar = ({ onNewProjectClick }) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>WebAR</h2>
      </div>
      <nav className="sidebar-nav">
        <button onClick={onNewProjectClick} className="new-project-button">
          + New Project
        </button>
        <ul>
          <li>
            <Link to="/">Projects</Link>
          </li>
        </ul>
      </nav>
      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;