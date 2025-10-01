import React from 'react';
import { supabase } from '../supabaseClient';
import './Home.css';

const Home = () => {
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      alert(error.error_description || error.message);
    }
  };

  return (
    <div className="home-container">
      <div className="home-content">
        <h1>hola</h1>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
    </div>
  );
};

export default Home;