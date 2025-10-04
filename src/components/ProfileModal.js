import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './ProfileModal.css';

const ProfileModal = ({ isOpen, onClose }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (isOpen) {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        setLoading(false);
      }
    };

    fetchUser();
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal-header">
          <h2>User Profile</h2>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <div className="profile-modal-body">
          {loading ? (
            <p>Loading profile...</p>
          ) : user ? (
            <div className="profile-info">
              <div className="info-item">
                <span className="info-label">Email:</span>
                <span className="info-value">{user.email}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Last Signed In:</span>
                <span className="info-value">{new Date(user.last_sign_in_at).toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <p>Could not retrieve user information.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;