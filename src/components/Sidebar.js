import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Sidebar.css';

const Sidebar = ({ onNewProjectClick, isCollapsed, toggleSidebar }) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <h2>{isCollapsed ? 'W' : 'WebAR'}</h2>
        <button onClick={toggleSidebar} className="toggle-button">
          {isCollapsed ? '→' : '←'}
        </button>
      </div>
      <nav className="sidebar-nav">
        <button onClick={onNewProjectClick} className="new-project-button">
          <span className="icon">+</span>
          {!isCollapsed && <span className="text">New Project</span>}
        </button>
        <ul>
          <li>
            <Link to="/">
              <span className="icon">📄</span>
              {!isCollapsed && <span className="text">Projects</span>}
            </Link>
          </li>
        </ul>
      </nav>
      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-button">
          <span className="icon">🚪</span>
          {!isCollapsed && <span className="text">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;