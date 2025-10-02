import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDrag, useDrop } from 'react-dnd';
import { FaFont, FaTrashAlt, FaArrowLeft } from 'react-icons/fa';
import { ItemTypes } from './ItemTypes';
import { supabase } from '../supabaseClient';
import './Canvas.css';

const DraggableTool = ({ type, icon, text }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: type,
    item: { type: type },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className="tool-item"
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <span className="tool-icon">{icon}</span>
      <span className="tool-text">{text}</span>
    </div>
  );
};

const DraggableDroppedItem = ({ id, left, top, text, onTextChange }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.TEXT,
        item: { id, left, top, type: ItemTypes.TEXT },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }), [id, left, top]);

    const handleTextChange = (e) => {
        onTextChange(id, e.target.value);
    };

    return (
        <div
            ref={drag}
            style={{ position: 'absolute', left, top, cursor: 'move', opacity: isDragging ? 0.5 : 1 }}
            className="dropped-item"
        >
            <textarea
                value={text}
                onChange={handleTextChange}
                className="editable-textarea"
                spellCheck="false"
            />
        </div>
    );
};


const Canvas = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [droppedItems, setDroppedItems] = useState({});
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);


  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('name')
        .eq('id', projectId)
        .single();

      if (error) {
        console.error('Error fetching project:', error);
        setProjectName('Project Not Found');
      } else if (data) {
        setProjectName(data.name);
      }
      setLoading(false);
    };

    fetchProject();
  }, [projectId]);

  const moveItem = useCallback((id, left, top) => {
    setDroppedItems(prevItems => {
        const newItems = { ...prevItems };
        if (newItems[id]) {
            newItems[id] = { ...newItems[id], left, top };
        }
        return newItems;
    });
  }, []);

  const handleTextChange = (id, newText) => {
    setDroppedItems(prevItems => ({
      ...prevItems,
      [id]: { ...prevItems[id], text: newText },
    }));
  };

  const canvasRef = useRef(null);
  const [, drop] = useDrop(() => ({
    accept: ItemTypes.TEXT,
    drop: (item, monitor) => {
      const id = item.id;
      // If the item has an ID, it's an existing item being moved.
      if (id) {
          const delta = monitor.getDifferenceFromInitialOffset();
          const left = Math.round(item.left + delta.x);
          const top = Math.round(item.top + delta.y);
          moveItem(id, left, top);
          return undefined;
      }

      // If no ID, it's a new item from the toolbar.
      if (canvasRef.current) {
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const clientOffset = monitor.getClientOffset();
        if (clientOffset) {
          const left = Math.round(clientOffset.x - canvasRect.left);
          const top = Math.round(clientOffset.y - canvasRect.top);
          const newId = Date.now();
          setDroppedItems(prev => ({
              ...prev,
              [newId]: { id: newId, left, top, text: 'Text area' }
          }));
        }
      }
    },
  }), [moveItem]);

  const [, trashDrop] = useDrop(() => ({
    accept: ItemTypes.TEXT,
    drop: (item) => {
      setDroppedItems(prev => {
        const newItems = { ...prev };
        delete newItems[item.id];
        return newItems;
      });
    },
  }));

  useEffect(() => {
    const handleDragStart = () => setIsDragging(true);
    const handleDragEnd = () => setIsDragging(false);
    window.addEventListener('dragstart', handleDragStart);
    window.addEventListener('dragend', handleDragEnd);
    return () => {
      window.removeEventListener('dragstart', handleDragStart);
      window.removeEventListener('dragend', handleDragEnd);
    };
  }, []);


  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="canvas-container">
        <header className="canvas-header">
            <button onClick={() => navigate('/')} className="back-button">
                <FaArrowLeft />
            </button>
            <h1>{projectName}</h1>
        </header>
        <div className="canvas-body">
            <div className="canvas-toolbar">
                <DraggableTool type={ItemTypes.TEXT} icon={<FaFont />} text="Text" />
            </div>
            <div ref={node => { canvasRef.current = node; drop(node); }} className="canvas-area">
                {Object.values(droppedItems).map((item) => (
                  <DraggableDroppedItem key={item.id} {...item} onTextChange={handleTextChange} />
                ))}
            </div>
        </div>
        {isDragging && (
          <div ref={trashDrop} className="trash-area">
            <FaTrashAlt size={32} />
          </div>
        )}
    </div>
  );
};

export default Canvas;