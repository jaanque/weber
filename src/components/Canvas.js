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
import SaveStatus from './SaveStatus';
import CustomDragLayer from './CustomDragLayer';
import './Canvas.css';
import './DistanceLines.css';
import './StylingToolbar.css';
import './SaveStatus.css';

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
    item: { type: type, width: 150, height: 50 }, // Default dimensions for new items
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
  const [lastSaved, setLastSaved] = useState(null);
  const itemsRef = useRef(items);
  const canvasRef = useRef(null);

  // Keep a ref to the latest items state to avoid stale closures in debounced function
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);


  // --- Database Operations ---
  const saveItem = useCallback(
    debounce(async (itemId) => {
      const itemToSave = itemsRef.current[itemId];
      if (!itemToSave) return;

      const { id, left, top, content, width, height, style, rotation } = itemToSave;
      const updateData = {
          left_pos: left,
          top_pos: top,
          content,
          width,
          height,
          style,
          rotation
      };

      const { error } = await supabase
        .from('canvas_items')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating item:', error);
      } else {
        setLastSaved(new Date());
      }
    }, 1000),
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
    setItems(prevItems => ({
        ...prevItems,
        [id]: { ...prevItems[id], left, top }
    }));
    saveItem(id);
  }, [saveItem]);

  const handleTextChange = (id, newText) => {
    setItems(prevItems => ({
      ...prevItems,
      [id]: { ...prevItems[id], content: newText },
    }));
    saveItem(id);
  };

  const handleResize = useCallback((id, width, height) => {
    setItems(prevItems => {
        const item = prevItems[id];
        if (item && (item.width !== width || item.height !== height)) {
            return {
                ...prevItems,
                [id]: { ...item, width, height },
            };
        }
        return prevItems;
    });
    saveItem(id);
  }, [saveItem]);

  const handleRotate = useCallback((id, rotation) => {
    setItems(prevItems => {
        const item = prevItems[id];
        if (item && item.rotation !== rotation) {
            return {
                ...prevItems,
                [id]: { ...item, rotation },
            };
        }
        return prevItems;
    });
    saveItem(id);
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
    setItems(prevItems => ({
        ...prevItems,
        [selectedItemId]: { ...prevItems[selectedItemId], style: newStyle },
    }));
    saveItem(selectedItemId);
  };

  // --- Drag and Drop Logic ---
  const [, drop] = useDrop(() => ({
    accept: ItemTypes.TEXT,
    hover(item, monitor) {
      if (!canvasRef.current || !monitor.isOver({ shallow: true })) {
        setGuides([]);
        setDistanceLines([]);
        return;
      }

      const canvasRect = canvasRef.current.getBoundingClientRect();
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      const { width, height } = item;
      let currentLeft, currentTop;

      if (item.id) {
        const delta = monitor.getDifferenceFromInitialOffset();
        if (!delta) return;
        currentLeft = Math.round(item.left + delta.x);
        currentTop = Math.round(item.top + delta.y);
      } else {
        currentLeft = Math.round(clientOffset.x - canvasRect.left - (width / 2));
        currentTop = Math.round(clientOffset.y - canvasRect.top - (height / 2));
      }

      const SNAP_THRESHOLD = 5;
      const newGuides = [];
      const newDistanceLines = [];

      // Canvas center guides
      const canvasCenterX = canvasRect.width / 2;
      const canvasCenterY = canvasRect.height / 2;
      const itemCenterX = currentLeft + width / 2;
      const itemCenterY = currentTop + height / 2;

      // Horizontal center guide
      if (Math.abs(itemCenterX - canvasCenterX) < SNAP_THRESHOLD) {
        newGuides.push({ type: 'vertical', position: canvasCenterX });
      }
      // Vertical center guide
      if (Math.abs(itemCenterY - canvasCenterY) < SNAP_THRESHOLD) {
        newGuides.push({ type: 'horizontal', position: canvasCenterY });
      }
      setGuides(newGuides);

      // Distance lines to edges (only show if close to edge)
      const DISTANCE_THRESHOLD = 50;
      if (currentTop < DISTANCE_THRESHOLD && currentTop > 0) {
        newDistanceLines.push({ x1: currentLeft + width/2, y1: 0, x2: currentLeft + width/2, y2: currentTop, distance: currentTop });
      }
      if (currentLeft < DISTANCE_THRESHOLD && currentLeft > 0) {
        newDistanceLines.push({ x1: 0, y1: currentTop + height/2, x2: currentLeft, y2: currentTop + height/2, distance: currentLeft });
      }
      const rightEdge = currentLeft + width;
      const distToRight = canvasRect.width - rightEdge;
      if (distToRight < DISTANCE_THRESHOLD && distToRight > 0) {
        newDistanceLines.push({ x1: rightEdge, y1: currentTop + height/2, x2: canvasRect.width, y2: currentTop + height/2, distance: Math.round(distToRight) });
      }
      const bottomEdge = currentTop + height;
      const distToBottom = canvasRect.height - bottomEdge;
      if (distToBottom < DISTANCE_THRESHOLD && distToBottom > 0) {
        newDistanceLines.push({ x1: currentLeft + width/2, y1: bottomEdge, x2: currentLeft + width/2, y2: canvasRect.height, distance: Math.round(distToBottom) });
      }
      setDistanceLines(newDistanceLines);
    },
    drop: (item, monitor) => {
      setGuides([]);
      setDistanceLines([]);
      if (!canvasRef.current) return;

      const canvasRect = canvasRef.current.getBoundingClientRect();
      let finalLeft, finalTop;

      if (item.id) {
        const delta = monitor.getDifferenceFromInitialOffset();
        if (!delta) return;
        finalLeft = Math.round(item.left + delta.x);
        finalTop = Math.round(item.top + delta.y);
      } else {
        const clientOffset = monitor.getClientOffset();
        if (!clientOffset) return;
        finalLeft = Math.round(clientOffset.x - canvasRect.left - (item.width / 2));
        finalTop = Math.round(clientOffset.y - canvasRect.top - (item.height / 2));
      }

      const { width, height } = item;
      const SNAP_THRESHOLD = 5;
      const canvasCenterX = canvasRect.width / 2;
      const canvasCenterY = canvasRect.height / 2;
      const itemCenterX = finalLeft + width / 2;
      const itemCenterY = finalTop + height / 2;

      // Snap to center
      if (Math.abs(itemCenterX - canvasCenterX) < SNAP_THRESHOLD) {
        finalLeft = Math.round(canvasCenterX - width / 2);
      }
      if (Math.abs(itemCenterY - canvasCenterY) < SNAP_THRESHOLD) {
        finalTop = Math.round(canvasCenterY - height / 2);
      }

      if (item.id) {
        moveItem(item.id, finalLeft, finalTop);
      } else {
        const newId = `temp-${Date.now()}`;
        const newItem = {
            id: newId,
            left: finalLeft,
            top: finalTop,
            content: 'Text area',
            width: item.width,
            height: item.height,
            rotation: 0,
            style: {
                fontSize: '16px',
                fontWeight: 'normal',
                fontStyle: 'normal',
                textDecoration: 'none',
                fontFamily: 'Arial',
                color: '#000000',
                textAlign: 'left'
            }
        };
        setItems(prev => ({ ...prev, [newId]: newItem }));
        createItem(newItem);
      }
    },
  }), [moveItem]);

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

  const getToolbarStyle = () => {
      if (!selectedItem || !canvasRef.current) return {};

      const canvasRect = canvasRef.current.getBoundingClientRect();
      const itemTop = selectedItem.top;
      const itemLeft = selectedItem.left;

      const top = itemTop - 60; // Default position above the item
      const left = itemLeft;

      // Flip below if not enough space above
      if (top < 0) {
          return { top: itemTop + selectedItem.height + 10, left };
      }
      return { top, left };
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="canvas-container">
        <CustomDragLayer />
        <SaveStatus lastSaved={lastSaved} />
        <header className="canvas-header">
            <button onClick={() => navigate('/')} className="back-button">
                <FaArrowLeft />
            </button>
            <h1>{projectName}</h1>
        </header>
        <div className="canvas-body">
            <aside className="canvas-toolbar">
                <DraggableTool type={ItemTypes.TEXT} icon={<FaFont />} text="Text" />
            </aside>
            <main
                ref={node => { canvasRef.current = node; drop(node); }}
                className="canvas-area"
                onClick={handleCanvasClick}
                data-testid="canvas-area"
            >
                {selectedItem && (
                    <div style={{...getToolbarStyle(), position: 'absolute', zIndex: 101}}>
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
                    onRotate={handleRotate}
                    onSelect={handleSelect}
                    isSelected={selectedItemId === item.id}
                  />
                ))}
            </main>
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