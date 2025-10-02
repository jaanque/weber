import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import './NewProjectModal.css';

const NewProjectModal = ({ isOpen, onClose, onProjectAdded }) => {
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('projects')
        .insert([{ name: projectName, user_id: user.id }])
        .select();

      if (error) {
        console.error('Error adding project:', error);
        alert(error.message);
      } else if (data) {
        onProjectAdded(data[0]);
        setProjectName('');
        onClose();
      }
    }
    setLoading(false);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Project</h2>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <form onSubmit={handleAddProject} className="modal-form">
          <input
            type="text"
            placeholder="Enter project name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            autoFocus
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewProjectModal;