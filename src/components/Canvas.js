import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDrag, useDrop } from 'react-dnd';
import { FaFont, FaTrashAlt, FaArrowLeft, FaUndo, FaRedo, FaKeyboard } from 'react-icons/fa';
import { ItemTypes } from './ItemTypes';
import { supabase } from '../supabaseClient';
import useUndoRedo from '../hooks/useUndoRedo';
import AlignmentGuides from './AlignmentGuides';
import DistanceLines from './DistanceLines';
import TextBox from './TextBox';
import GeometricShape from './GeometricShape';
import ShapeTool from './ShapeTool';
import StylingToolbar from './StylingToolbar';
import SaveStatus from './SaveStatus';
import CustomDragLayer from './CustomDragLayer';
import ShortcutsModal from './ShortcutsModal';
import UserProfile from './UserProfile';
import './Canvas.css';
import './DistanceLines.css';
import './StylingToolbar.css';
import './SaveStatus.css';
import './ShortcutsModal.css';
import './GeometricShape.css';
import './ShapePicker.css';
import './ShapeTool.css';
import './UserProfile.css';

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
  const {
    state: items,
    past,
    future,
    setState,
    setPresent,
    resetHistory,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoRedo();
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [guides, setGuides] = useState([]);
  const [distanceLines, setDistanceLines] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const itemsRef = useRef(items);
  const canvasRef = useRef(null);

  const handleSaveProjectName = async (newName) => {
    if (newName.trim() === '') return;

    setProjectName(newName);
    setIsEditingTitle(false);

    const { error } = await supabase
      .from('projects')
      .update({ name: newName })
      .eq('id', projectId);

    if (error) {
      console.error('Error updating project name:', error);
      // Optionally, revert the name or show an error to the user
    }
  };

  // Keep a ref to the latest items state to avoid stale closures in debounced function
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);


  // --- Keyboard Shortcuts for Undo/Redo ---
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'z') {
        event.preventDefault();
        undo();
      } else if ((event.metaKey || event.ctrlKey) && (event.key === 'y' || (event.key === 'Z' && event.shiftKey))) {
        event.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo]);


  // --- Database Operations ---
  const saveHistory = useCallback(
    debounce(async (currentHistory) => {
      const { error } = await supabase
        .from('projects')
        .update({
          history_past: currentHistory.past,
          history_present: currentHistory.present,
          history_future: currentHistory.future,
        })
        .eq('id', projectId);

      if (error) {
        console.error('Error saving history:', error);
      } else {
        setLastSaved(new Date());
      }
    }, 2000),
    [projectId]
  );

  // --- Fetch Initial Data ---
  useEffect(() => {
    const fetchProjectAndItems = async () => {
      setLoading(true);
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('name, history_past, history_present, history_future')
        .eq('id', projectId)
        .single();

      if (projectError) {
        console.error('Error fetching project:', projectError);
        setProjectName('Project Not Found');
        setLoading(false);
        return;
      }

      if (projectData) {
        setProjectName(projectData.name);
        const initialHistory = {
          past: projectData.history_past || [],
          present: projectData.history_present || {},
          future: projectData.history_future || [],
        };
        resetHistory(initialHistory);
      }
      setLoading(false);
    };

    fetchProjectAndItems();
  }, [projectId, resetHistory]);

  // --- Auto-save history on change ---
  const isInitialMount = useRef(true);
  useEffect(() => {
    // Don't save on initial load
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    // Don't save while loading data
    if (!loading) {
      saveHistory({ past, present: items, future });
    }
  }, [items, past, future, loading, saveHistory]);


  // --- Item Manipulation Callbacks ---
  const moveItem = useCallback((id, left, top) => {
    setState(prevItems => ({
        ...prevItems,
        [id]: { ...prevItems[id], left, top }
    }));
  }, [setState]);

  const handleTextChange = (id, newText) => {
    setState(prevItems => ({
      ...prevItems,
      [id]: { ...prevItems[id], content: newText },
    }));
  };

  const handleResize = useCallback((id, width, height) => {
    setState(prevItems => {
        const item = prevItems[id];
        if (item && (item.width !== width || item.height !== height)) {
            return {
                ...prevItems,
                [id]: { ...item, width, height },
            };
        }
        return prevItems;
    });
  }, [setState]);

  const handleRotate = useCallback((id, rotation) => {
    setState(prevItems => {
        const item = prevItems[id];
        if (item && item.rotation !== rotation) {
            return {
                ...prevItems,
                [id]: { ...item, rotation },
            };
        }
        return prevItems;
    });
  }, [setState]);

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
    setState(prevItems => ({
        ...prevItems,
        [selectedItemId]: { ...prevItems[selectedItemId], style: newStyle },
    }));
  };

  // --- Drag and Drop Logic ---
  const [, drop] = useDrop(() => ({
    accept: [ItemTypes.TEXT, ItemTypes.SHAPE],
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

      // Vertical guide for horizontal center alignment
      if (Math.abs(itemCenterX - canvasCenterX) < SNAP_THRESHOLD) {
        newGuides.push({ orientation: 'vertical', left: canvasCenterX });
      }
      // Horizontal guide for vertical center alignment
      if (Math.abs(itemCenterY - canvasCenterY) < SNAP_THRESHOLD) {
        newGuides.push({ orientation: 'horizontal', top: canvasCenterY });
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

      // Do not move item if it's a new one, as it will be handled by createItem
      if (item.id) { // Existing item
        moveItem(item.id, finalLeft, finalTop);
      } else { // New item
        const newId = crypto.randomUUID();
        let newItem;

        if (item.type === ItemTypes.TEXT) {
            newItem = {
              id: newId,
              type: ItemTypes.TEXT,
              project_id: projectId,
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
                textAlign: 'left',
              },
            };
        } else if (item.type === ItemTypes.SHAPE) {
            newItem = {
                id: newId,
                type: ItemTypes.SHAPE,
                shapeType: item.shapeType,
                project_id: projectId,
                left: finalLeft,
                top: finalTop,
                width: item.width,
                height: item.height,
                rotation: 0,
                style: {
                    color: '#cccccc',
                    borderColor: '#333333',
                    borderWidth: 2,
                },
            };
        }
        if (newItem) {
            setState(prev => ({ ...prev, [newId]: newItem }));
        }
      }
    },
  }), [moveItem, setState, projectId]);

  const [{ isOver: isTrashOver }, trashDrop] = useDrop(() => ({
    accept: [ItemTypes.TEXT, ItemTypes.SHAPE],
    drop: (item) => {
      // Optimistically remove from UI and add to history
      setState(prev => {
          const newItems = {...prev};
          delete newItems[item.id];
          return newItems;
      });
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
    <div
      ref={node => {
        canvasRef.current = node;
        drop(node);
      }}
      className="canvas-container" // This will be styled as full-screen
      onClick={handleCanvasClick}
      data-testid="canvas-area"
    >
      <CustomDragLayer />
      <SaveStatus lastSaved={lastSaved} />
      <ShortcutsModal isOpen={isShortcutsModalOpen} onClose={() => setIsShortcutsModalOpen(false)} />

      {/* Floating UI Elements */}
      <div className="floating-ui-top-left">
        <button onClick={() => navigate('/')} className="back-button-float">
          <FaArrowLeft />
        </button>
        {isEditingTitle ? (
          <input
            type="text"
            defaultValue={projectName}
            onBlur={(e) => handleSaveProjectName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSaveProjectName(e.target.value);
              } else if (e.key === 'Escape') {
                setIsEditingTitle(false);
              }
            }}
            autoFocus
            className="project-name-input"
          />
        ) : (
          <span
            className="project-name-float"
            onClick={() => setIsEditingTitle(true)}
            title="Click to edit"
          >
            {projectName}
          </span>
        )}
      </div>

      <div className="floating-ui-top-right">
        <button onClick={() => setIsShortcutsModalOpen(true)} className="action-button-float" aria-label="Show shortcuts">
            <FaKeyboard />
        </button>
        <UserProfile />
      </div>

      <div className="floating-ui-bottom-right">
        <button className="share-button-float">Share</button>
      </div>


      <aside className="floating-toolbar">
          <DraggableTool type={ItemTypes.TEXT} icon={<FaFont />} text="Text" />
          <ShapeTool />
      </aside>

      {selectedItem && (
        <div className="floating-styling-toolbar">
          <StylingToolbar
            selectedItem={selectedItem}
            onStyleChange={handleStyleChange}
            onRotate={handleRotate}
          />
        </div>
      )}
      <AlignmentGuides guides={guides} />
      <DistanceLines lines={distanceLines} />
      {Object.values(items).map((item) => {
        if (item.type === ItemTypes.SHAPE) {
          return (
            <GeometricShape
              key={item.id}
              {...item}
              onResize={handleResize}
              onRotate={handleRotate}
              onSelect={handleSelect}
              isSelected={selectedItemId === item.id}
            />
          );
        }
        return (<TextBox
          key={item.id}
          {...item}
          onTextChange={handleTextChange}
          onResize={handleResize}
          onRotate={handleRotate}
          onSelect={handleSelect}
          isSelected={selectedItemId === item.id}
        />);
      })}

      {isDragging && (
        <div ref={trashDrop} className={`trash-area ${isTrashOver ? 'hovered' : ''}`}>
          <FaTrashAlt size={24} />
        </div>
      )}
    </div>
  );
};

export default Canvas;