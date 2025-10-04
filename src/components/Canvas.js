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
import './Canvas.css';
import './DistanceLines.css';
import './StylingToolbar.css';
import './SaveStatus.css';
import './ShortcutsModal.css';
import './GeometricShape.css';
import './ShapePicker.css';
import './ShapeTool.css';

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
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const isSpacePressedRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const itemsRef = useRef(items);
  const canvasRef = useRef(null);
  const canvasContentRef = useRef(null);


  // Keep a ref to the latest items state to avoid stale closures in debounced function
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);


  // --- Keyboard Shortcuts & Panning ---
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Panning with spacebar
      if (event.code === 'Space') {
        event.preventDefault();
        if (!isSpacePressedRef.current) {
          isSpacePressedRef.current = true;
          if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
        }
      }

      // Undo/Redo
      if ((event.metaKey || event.ctrlKey) && event.key === 'z') {
        event.preventDefault();
        undo();
      } else if ((event.metaKey || event.ctrlKey) && (event.key === 'y' || (event.key === 'Z' && event.shiftKey))) {
        event.preventDefault();
        redo();
      }
    };

    const handleKeyUp = (event) => {
      if (event.code === 'Space') {
        isSpacePressedRef.current = false;
        // Only change cursor if not in the middle of a pan
        if (canvasRef.current && !isPanning) {
            canvasRef.current.style.cursor = 'default';
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [undo, redo, isPanning]); // isPanning is included to correctly manage cursor on keyup


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
    // Deselect if clicking on the canvas background
    if (e.target === canvasRef.current || e.target === canvasContentRef.current) {
        setSelectedItemId(null);
    }
  }

  const handleMouseDown = (e) => {
      handleCanvasClick(e);
      if (isSpacePressedRef.current) {
          setIsPanning(true);
          panStartRef.current = {
              x: e.clientX - viewOffset.x,
              y: e.clientY - viewOffset.y,
          };
          if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
      }
  };

  const handleMouseUp = () => {
      if (isPanning) {
          setIsPanning(false);
          if (canvasRef.current) {
              canvasRef.current.style.cursor = isSpacePressedRef.current ? 'grab' : 'default';
          }
      }
  };

  const handleMouseMove = (e) => {
      if (isPanning) {
          const newX = e.clientX - panStartRef.current.x;
          const newY = e.clientY - panStartRef.current.y;
          setViewOffset({ x: newX, y: newY });
      }
  };


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

      // Calculate position relative to the panned canvas content
      if (item.id) {
        const delta = monitor.getDifferenceFromInitialOffset();
        if (!delta) return;
        currentLeft = Math.round(item.left + delta.x);
        currentTop = Math.round(item.top + delta.y);
      } else {
        currentLeft = Math.round(clientOffset.x - canvasRect.left - viewOffset.x - (width / 2));
        currentTop = Math.round(clientOffset.y - canvasRect.top - viewOffset.y - (height / 2));
      }

      const SNAP_THRESHOLD = 5;
      const newGuides = [];
      setDistanceLines([]); // Distance lines are disabled for now with infinite canvas

      // --- Alignment Guides (relative to canvas-area) ---
      const itemCenterXInArea = currentLeft + viewOffset.x + width / 2;
      const itemCenterYInArea = currentTop + viewOffset.y + height / 2;
      const canvasCenterXInArea = canvasRect.width / 2;
      const canvasCenterYInArea = canvasRect.height / 2;

      // Horizontal center guide
      if (Math.abs(itemCenterXInArea - canvasCenterXInArea) < SNAP_THRESHOLD) {
        newGuides.push({ type: 'vertical', position: canvasCenterXInArea });
      }
      // Vertical center guide
      if (Math.abs(itemCenterYInArea - canvasCenterYInArea) < SNAP_THRESHOLD) {
        newGuides.push({ type: 'horizontal', position: canvasCenterYInArea });
      }
      setGuides(newGuides);
    },
    drop: (item, monitor) => {
      setGuides([]);
      setDistanceLines([]);
      if (!canvasRef.current) return;

      const canvasRect = canvasRef.current.getBoundingClientRect();
      let finalLeft, finalTop;

      // Calculate final position relative to the panned canvas content
      if (item.id) {
        const delta = monitor.getDifferenceFromInitialOffset();
        if (!delta) return;
        finalLeft = Math.round(item.left + delta.x);
        finalTop = Math.round(item.top + delta.y);
      } else {
        const clientOffset = monitor.getClientOffset();
        if (!clientOffset) return;
        finalLeft = Math.round(clientOffset.x - canvasRect.left - viewOffset.x - (item.width / 2));
        finalTop = Math.round(clientOffset.y - canvasRect.top - viewOffset.y - (item.height / 2));
      }

      const { width, height } = item;
      const SNAP_THRESHOLD = 5;

      // --- Snap to Center (relative to canvas-area) ---
      const itemCenterXInArea = finalLeft + viewOffset.x + width / 2;
      const itemCenterYInArea = finalTop + viewOffset.y + height / 2;
      const canvasCenterXInArea = canvasRect.width / 2;
      const canvasCenterYInArea = canvasRect.height / 2;

      // Snap horizontal
      if (Math.abs(itemCenterXInArea - canvasCenterXInArea) < SNAP_THRESHOLD) {
        finalLeft = Math.round(canvasCenterXInArea - viewOffset.x - width / 2);
      }
      // Snap vertical
      if (Math.abs(itemCenterYInArea - canvasCenterYInArea) < SNAP_THRESHOLD) {
        finalTop = Math.round(canvasCenterYInArea - viewOffset.y - height / 2);
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
  }), [moveItem, setState, projectId, viewOffset]);

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
    <div className="canvas-container">
        <CustomDragLayer />
        <SaveStatus lastSaved={lastSaved} />
        <ShortcutsModal isOpen={isShortcutsModalOpen} onClose={() => setIsShortcutsModalOpen(false)} />
        <header className="canvas-header">
            <button onClick={() => navigate('/')} className="back-button">
                <FaArrowLeft />
            </button>
            <h1>{projectName}</h1>
            <div className="header-actions">
                <button onClick={undo} disabled={!canUndo} className="undo-redo-button" aria-label="Undo">
                    <FaUndo />
                </button>
                <button onClick={redo} disabled={!canRedo} className="undo-redo-button" aria-label="Redo">
                    <FaRedo />
                </button>
                <button onClick={() => setIsShortcutsModalOpen(true)} className="undo-redo-button" aria-label="Show shortcuts">
                    <FaKeyboard />
                </button>
            </div>
        </header>
        <div className="canvas-body">
            <aside className="canvas-toolbar">
                <DraggableTool type={ItemTypes.TEXT} icon={<FaFont />} text="Text" />
                <ShapeTool />
            </aside>
            <main
                ref={node => { canvasRef.current = node; drop(node); }}
                className="canvas-area"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                data-testid="canvas-area"
            >
                <AlignmentGuides guides={guides} />
                <DistanceLines lines={distanceLines} />
                <div
                    ref={canvasContentRef}
                    className="canvas-content"
                    style={{ transform: `translate(${viewOffset.x}px, ${viewOffset.y}px)` }}
                >
                    {selectedItem && (
                        <div style={{...getToolbarStyle(), position: 'absolute', zIndex: 101}}>
                            <StylingToolbar
                                selectedItem={selectedItem}
                                onStyleChange={handleStyleChange}
                                onRotate={handleRotate}
                            />
                        </div>
                    )}
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
                      // Default to TextBox for legacy items or text items
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
                </div>
            </main>
        </div>
        {isDragging && (
          <div ref={trashDrop} className={`trash-area ${isTrashOver ? 'hovered' : ''}`}>
            <FaTrashAlt size={24} />
          </div>
        )}
    </div>
  );
};

export default Canvas;