import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import TextBox from './TextBox';
import GeometricShape from './GeometricShape';
import './PublicView.css';

const PublicView = () => {
  const { projectId } = useParams();
  const [loading, setLoading] = useState(true);
  const [projectData, setProjectData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);

      // Fetch from the 'projects' table directly.
      // RLS policy allows anyone to read if `is_public` is true.
      const { data, error } = await supabase
        .from('projects')
        .select('name, history_present, publication_details')
        .eq('id', projectId)
        .eq('is_public', true)
        .single();

      if (error) {
        console.error('Error fetching public project:', error);
        setError('This project could not be loaded. It may not be public or has been removed.');
        setProjectData(null);
      } else {
        setProjectData(data);
        setError(null);
      }
      setLoading(false);
    };

    fetchProject();
  }, [projectId]);

  if (loading) {
    return <div className="public-view-status">Loading...</div>;
  }

  if (error) {
    return <div className="public-view-status">{error}</div>;
  }

  if (!projectData || !projectData.publication_details) {
    return <div className="public-view-status">This project is not configured for public viewing.</div>;
  }

  const { history_present: items, publication_details: frame } = projectData;
  const itemsToRender = Object.values(items).filter(item => {
    // Check if the item is within the publication frame
    return (
      item.left >= frame.left &&
      item.top >= frame.top &&
      (item.left + item.width) <= (frame.left + frame.width) &&
      (item.top + item.height) <= (frame.top + frame.height)
    );
  });

  return (
    <div className="public-view-container">
      <div
        className="public-canvas"
        style={{
          width: `${frame.width}px`,
          height: `${frame.height}px`,
          position: 'relative',
        }}
      >
        {itemsToRender.map((item) => {
          const itemStyle = {
            ...item,
            // Adjust position to be relative to the frame
            left: item.left - frame.left,
            top: item.top - frame.top,
          };

          if (item.type === 'shape') {
            return <GeometricShape key={item.id} {...itemStyle} isSelected={false} />;
          }
          return <TextBox key={item.id} {...itemStyle} isSelected={false} />;
        })}
      </div>
      <footer className="public-view-footer">
        Powered by YourAppName
      </footer>
    </div>
  );
};

export default PublicView;