import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDrag, useDrop } from 'react-dnd';
import { FaFont, FaTrashAlt, FaArrowLeft } from 'react-icons/fa';
import { ItemTypes } from './ItemTypes';
import { supabase } from '../supabaseClient';
import AlignmentGuides from './AlignmentGuides';
import DistanceLines from './DistanceLines';
import TextBox from './TextBox';
import StylingToolbar from './StylingToolbar';
import './Canvas.css';
import './DistanceLines.css';
import './StylingToolbar.css';

// Debounce function to limit the rate of API calls
const debounce = (func, delay) => {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
};

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

const Canvas = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState({});
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [guides, setGuides] = useState([]);
  const [distanceLines, setDistanceLines] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState(null);

  const canvasRef = useRef(null);

  // --- Database Operations ---
  const saveItem = useCallback(
    debounce(async (itemToSave) => {
      const { id, left, top, content, width, height, style } = itemToSave;
      const updateData = {
          left_pos: left,
          top_pos: top,
          content: content, // Ensure content is explicitly included
          width,
          height,
          style
      };

      const { error } = await supabase
        .from('canvas_items')
        .update(updateData)
        .eq('id', id);
      if (error) {
        console.error('Error updating item:', error);
      }
    }, 500),
    []
  );

  const createItem = async (item) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { id, left, top, ...rest } = item;
    const insertData = {
        ...rest,
        project_id: projectId,
        user_id: user.id,
        left_pos: left,
        top_pos: top
    };

    const { data, error } = await supabase
      .from('canvas_items')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating item:', error);
      setItems(prev => {
          const newItems = {...prev};
          delete newItems[item.id];
          return newItems;
      });
      return;
    }

    setItems(prev => {
        const newItems = {...prev};
        delete newItems[item.id];
        const dbItem = { ...data, left: data.left_pos, top: data.top_pos };
        newItems[data.id] = dbItem;
        return newItems;
    });
  };

  const deleteItem = async (id) => {
    const { error } = await supabase
        .from('canvas_items')
        .delete()
        .eq('id', id);
    if (error) {
        console.error('Error deleting item:', error);
    } else {
        setItems(prev => {
            const newItems = {...prev};
            delete newItems[id];
            return newItems;
        });
    }
  };


  // --- Fetch Initial Data ---
  useEffect(() => {
    const fetchProjectAndItems = async () => {
      setLoading(true);
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('name')
        .eq('id', projectId)
        .single();

      if (projectError) {
        console.error('Error fetching project:', projectError);
        setProjectName('Project Not Found');
      } else if (projectData) {
        setProjectName(projectData.name);
      }

      const { data: itemsData, error: itemsError } = await supabase
        .from('canvas_items')
        .select('*')
        .eq('project_id', projectId);

      if (itemsError) {
        console.error('Error fetching items:', itemsError);
      } else {
        const itemsMap = itemsData.reduce((acc, item) => {
          acc[item.id] = {
              ...item,
              left: item.left_pos,
              top: item.top_pos,
          };
          return acc;
        }, {});
        setItems(itemsMap);
      }
      setLoading(false);
    };

    fetchProjectAndItems();
  }, [projectId]);


  // --- Item Manipulation Callbacks ---
  const moveItem = useCallback((id, left, top) => {
    setItems(prevItems => {
        const newItems = { ...prevItems };
        if (newItems[id]) {
            const updatedItem = { ...newItems[id], left, top };
            saveItem(updatedItem);
            return { ...newItems, [id]: updatedItem };
        }
        return newItems;
    });
  }, [saveItem]);

  const handleTextChange = (id, newText) => {
    setItems(prevItems => {
      const updatedItem = { ...prevItems[id], content: newText };
      saveItem(updatedItem);
      return {
        ...prevItems,
        [id]: updatedItem,
      };
    });
  };

  const handleResize = useCallback((id, width, height) => {
    setItems(prevItems => {
        const item = prevItems[id];
        if (item && (item.width !== width || item.height !== height)) {
            const updatedItem = { ...item, width, height };
            saveItem(updatedItem);
            return {
                ...prevItems,
                [id]: updatedItem,
            };
        }
        return prevItems;
    });
  }, [saveItem]);

  const handleSelect = (id) => {
    setSelectedItemId(id);
  }

  const handleCanvasClick = (e) => {
    if (e.target === e.currentTarget) {
        setSelectedItemId(null);
    }
  }

  const handleStyleChange = (newStyle) => {
    if (!selectedItemId) return;

    setItems(prevItems => {
        const item = prevItems[selectedItemId];
        if (!item) return prevItems;

        const updatedItem = { ...item, style: newStyle };
        saveItem(updatedItem);
        return {
            ...prevItems,
            [selectedItemId]: updatedItem,
        };
    });
  };

  // --- Drag and Drop Logic ---
  const [, drop] = useDrop(() => ({
    accept: ItemTypes.TEXT,
    drop: (item, monitor) => {
      setGuides([]);
      setDistanceLines([]);
      const id = item.id;
      if (!id) {
          if (canvasRef.current) {
            const canvasRect = canvasRef.current.getBoundingClientRect();
            const clientOffset = monitor.getClientOffset();
            if (clientOffset) {
              const left = Math.round(clientOffset.x - canvasRect.left);
              const top = Math.round(clientOffset.y - canvasRect.top);

              const newId = `temp-${Date.now()}`;
              const newItem = {
                  id: newId,
                  left,
                  top,
                  content: 'Text area',
                  width: 150,
                  height: 50,
                  style: { fontSize: '16px', fontWeight: 'normal', fontStyle: 'normal' }
              };

              setItems(prev => ({ ...prev, [newId]: newItem }));
              createItem(newItem);
            }
          }
          return;
      }

      const delta = monitor.getDifferenceFromInitialOffset();
      if (!delta) return;

      let newLeft = Math.round(item.left + delta.x);
      let newTop = Math.round(item.top + delta.y);

      moveItem(id, newLeft, newTop);
    },
  }), [moveItem, items]);

  const [{ isOver: isTrashOver }, trashDrop] = useDrop(() => ({
    accept: ItemTypes.TEXT,
    drop: (item) => {
      deleteItem(item.id);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  useEffect(() => {
    const handleDragStart = () => setIsDragging(true);
    const handleDragEnd = () => {
        setIsDragging(false);
        setGuides([]);
        setDistanceLines([]);
    };
    window.addEventListener('dragstart', handleDragStart);
    window.addEventListener('dragend', handleDragEnd);
    return () => {
      window.removeEventListener('dragstart', handleDragStart);
      window.removeEventListener('dragend', handleDragEnd);
    };
  }, []);

  const selectedItem = selectedItemId ? items[selectedItemId] : null;

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
            <div
                ref={node => { canvasRef.current = node; drop(node); }}
                className="canvas-area"
                onClick={handleCanvasClick}
                data-testid="canvas-area"
            >
                {selectedItem && (
                    <div style={{ position: 'absolute', left: selectedItem.left, top: selectedItem.top }}>
                        <StylingToolbar
                            selectedItem={selectedItem}
                            onStyleChange={handleStyleChange}
                        />
                    </div>
                )}
                <AlignmentGuides guides={guides} />
                <DistanceLines lines={distanceLines} />
                {Object.values(items).map((item) => (
                  <TextBox
                    key={item.id}
                    {...item}
                    onTextChange={handleTextChange}
                    onResize={handleResize}
                    onSelect={handleSelect}
                    isSelected={selectedItemId === item.id}
                  />
                ))}
            </div>
        </div>
        {isDragging && (
          <div ref={trashDrop} className={`trash-area ${isTrashOver ? 'hovered' : ''}`}>
            <FaTrashAlt size={32} />
          </div>
        )}
    </div>
  );
};

export default Canvas;