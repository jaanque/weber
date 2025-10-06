import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDrag, useDrop } from 'react-dnd';
import { FaFont, FaTrashAlt, FaArrowLeft, FaUndo, FaRedo, FaKeyboard, FaMousePointer, FaHandPaper } from 'react-icons/fa';
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
  const [viewTransform, setViewTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [toolMode, setToolMode] = useState('select'); // 'select' or 'pan'
  const [nextZIndex, setNextZIndex] = useState(1);
  const panState = useRef({ isSpaceDown: false, isPanning: false, start: { x: 0, y: 0 } });
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
        const itemsWithZIndex = {};
        let maxZ = 0;
        Object.entries(initialHistory.present).forEach(([id, item], index) => {
          const zIndex = item.zIndex || index + 1;
          itemsWithZIndex[id] = { ...item, zIndex };
          if (zIndex > maxZ) {
            maxZ = zIndex;
          }
        });
        initialHistory.present = itemsWithZIndex;
        setNextZIndex(maxZ + 1);
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
    if (toolMode === 'pan') return;
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

  const handleBringToFront = () => {
    if (!selectedItemId) return;
    setState(prevItems => ({
      ...prevItems,
      [selectedItemId]: { ...prevItems[selectedItemId], zIndex: nextZIndex },
    }));
    setNextZIndex(prevZ => prevZ + 1);
  };

  const handleSendToBack = () => {
    if (!selectedItemId) return;
    const minZIndex = Math.min(...Object.values(items).map(item => item.zIndex || 0));
    setState(prevItems => ({
      ...prevItems,
      [selectedItemId]: { ...prevItems[selectedItemId], zIndex: minZIndex - 1 },
    }));
  };

  // --- Enhanced Drag and Drop Logic with Smart Guides and Snapping ---
  const [, drop] = useDrop(() => ({
    accept: [ItemTypes.TEXT, ItemTypes.SHAPE],
    canDrop: () => toolMode === 'select',
    hover(item, monitor) {
      if (!canvasRef.current || !monitor.isOver({ shallow: true }) || panState.current.isPanning) {
        setGuides([]);
        return;
      }

      const canvasRect = canvasRef.current.getBoundingClientRect();
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      const { width, height } = item;
      let currentLeft, currentTop;

      // Get the current position of the dragged item, adjusted for zoom and pan
      if (item.id) {
        const delta = monitor.getDifferenceFromInitialOffset();
        if (!delta) return;
        currentLeft = Math.round(item.left + delta.x / viewTransform.scale);
        currentTop = Math.round(item.top + delta.y / viewTransform.scale);
      } else {
        const screenX = clientOffset.x - canvasRect.left;
        const screenY = clientOffset.y - canvasRect.top;
        currentLeft = Math.round((screenX - viewTransform.x) / viewTransform.scale - (width / 2));
        currentTop = Math.round((screenY - viewTransform.y) / viewTransform.scale - (height / 2));
      }

      const SNAP_THRESHOLD = 6;
      const newGuides = [];

      const draggedGeom = {
          left: currentLeft,
          top: currentTop,
          hCenter: currentLeft + width / 2,
          vCenter: currentTop + height / 2,
          right: currentLeft + width,
          bottom: currentTop + height,
      };

      // Check for snapping against other items
      Object.values(itemsRef.current).forEach(otherItem => {
          if (!otherItem || otherItem.id === item.id) return;

          const staticGeom = {
              left: otherItem.left,
              top: otherItem.top,
              hCenter: otherItem.left + otherItem.width / 2,
              vCenter: otherItem.top + otherItem.height / 2,
              right: otherItem.left + otherItem.width,
              bottom: otherItem.top + otherItem.height,
          };

          const verticalAlignments = [
              { p1: draggedGeom.left, p2: staticGeom.left }, { p1: draggedGeom.left, p2: staticGeom.right }, { p1: draggedGeom.hCenter, p2: staticGeom.hCenter },
              { p1: draggedGeom.right, p2: staticGeom.left }, { p1: draggedGeom.right, p2: staticGeom.right },
          ];
          const horizontalAlignments = [
              { p1: draggedGeom.top, p2: staticGeom.top }, { p1: draggedGeom.top, p2: staticGeom.bottom }, { p1: draggedGeom.vCenter, p2: staticGeom.vCenter },
              { p1: draggedGeom.bottom, p2: staticGeom.top }, { p1: draggedGeom.bottom, p2: staticGeom.bottom },
          ];

          verticalAlignments.forEach(align => {
              if (Math.abs(align.p1 - align.p2) < SNAP_THRESHOLD) {
                  newGuides.push({ orientation: 'vertical', left: align.p2 });
              }
          });
          horizontalAlignments.forEach(align => {
              if (Math.abs(align.p1 - align.p2) < SNAP_THRESHOLD) {
                  newGuides.push({ orientation: 'horizontal', top: align.p2 });
              }
          });
      });

      // Check for canvas center guides
      const canvasCenterX = canvasRect.width / 2;
      const canvasCenterY = canvasRect.height / 2;
      if (Math.abs(draggedGeom.hCenter - canvasCenterX) < SNAP_THRESHOLD) {
          newGuides.push({ orientation: 'vertical', left: canvasCenterX });
      }
      if (Math.abs(draggedGeom.vCenter - canvasCenterY) < SNAP_THRESHOLD) {
          newGuides.push({ orientation: 'horizontal', top: canvasCenterY });
      }

      setGuides(newGuides);
    },
    drop: (item, monitor) => {
        setGuides([]); // Clear guides on drop
        if (!canvasRef.current) return;

        const canvasRect = canvasRef.current.getBoundingClientRect();
        let finalLeft, finalTop;

        // Calculate initial drop position, adjusted for zoom and pan
        if (item.id) {
            const delta = monitor.getDifferenceFromInitialOffset();
            if (!delta) return;
            finalLeft = Math.round(item.left + delta.x / viewTransform.scale);
            finalTop = Math.round(item.top + delta.y / viewTransform.scale);
        } else {
            const clientOffset = monitor.getClientOffset();
            if (!clientOffset) return;
            const screenX = clientOffset.x - canvasRect.left;
            const screenY = clientOffset.y - canvasRect.top;
            finalLeft = Math.round((screenX - viewTransform.x) / viewTransform.scale - (item.width / 2));
            finalTop = Math.round((screenY - viewTransform.y) / viewTransform.scale - (item.height / 2));
        }

        const { width, height } = item;
        const SNAP_THRESHOLD = 6;
        let isSnappedX = false;
        let isSnappedY = false;

        const draggedGeom = {
            left: finalLeft, top: finalTop, hCenter: finalLeft + width / 2,
            vCenter: finalTop + height / 2, right: finalLeft + width, bottom: finalTop + height
        };

        // --- Snapping Logic (repeated from hover to determine final position) ---
        Object.values(itemsRef.current).forEach(otherItem => {
            if (!otherItem || (item.id && otherItem.id === item.id)) return;

            const staticGeom = {
                left: otherItem.left, top: otherItem.top, hCenter: otherItem.left + otherItem.width / 2,
                vCenter: otherItem.top + otherItem.height / 2, right: otherItem.left + otherItem.width, bottom: otherItem.top + otherItem.height
            };

            // Vertical snapping
            if (!isSnappedX) {
                const verticalAlignments = [
                    { p1: draggedGeom.left, p2: staticGeom.left }, { p1: draggedGeom.left, p2: staticGeom.right }, { p1: draggedGeom.hCenter, p2: staticGeom.hCenter },
                    { p1: draggedGeom.right, p2: staticGeom.left }, { p1: draggedGeom.right, p2: staticGeom.right },
                ];
                for (const align of verticalAlignments) {
                    if (Math.abs(align.p1 - align.p2) < SNAP_THRESHOLD) {
                        finalLeft -= (align.p1 - align.p2);
                        isSnappedX = true;
                        break;
                    }
                }
            }
            // Horizontal snapping
            if (!isSnappedY) {
                const horizontalAlignments = [
                    { p1: draggedGeom.top, p2: staticGeom.top }, { p1: draggedGeom.top, p2: staticGeom.bottom }, { p1: draggedGeom.vCenter, p2: staticGeom.vCenter },
                    { p1: draggedGeom.bottom, p2: staticGeom.top }, { p1: draggedGeom.bottom, p2: staticGeom.bottom },
                ];
                 for (const align of horizontalAlignments) {
                    if (Math.abs(align.p1 - align.p2) < SNAP_THRESHOLD) {
                        finalTop -= (align.p1 - align.p2);
                        isSnappedY = true;
                        break;
                    }
                }
            }
        });

        // Canvas center snapping as a fallback
        const canvasCenterX = canvasRect.width / 2;
        const canvasCenterY = canvasRect.height / 2;
        if (!isSnappedX && Math.abs(draggedGeom.hCenter - canvasCenterX) < SNAP_THRESHOLD) {
            finalLeft = Math.round(canvasCenterX - width / 2);
        }
        if (!isSnappedY && Math.abs(draggedGeom.vCenter - canvasCenterY) < SNAP_THRESHOLD) {
            finalTop = Math.round(canvasCenterY - height / 2);
        }

        // --- End Snapping Logic ---

        if (item.id) {
            moveItem(item.id, finalLeft, finalTop);
        } else {
            const newId = crypto.randomUUID();
            let newItem;
            if (item.type === ItemTypes.TEXT) {
                newItem = { id: newId, type: ItemTypes.TEXT, project_id: projectId, left: finalLeft, top: finalTop, content: 'Text area', width: item.width, height: item.height, rotation: 0, zIndex: nextZIndex, style: { fontSize: '16px', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', fontFamily: 'Arial', color: '#000000', textAlign: 'left' } };
            } else if (item.type === ItemTypes.SHAPE) {
                newItem = { id: newId, type: ItemTypes.SHAPE, shapeType: item.shapeType, project_id: projectId, left: finalLeft, top: finalTop, width: item.width, height: item.height, rotation: 0, zIndex: nextZIndex, style: { color: '#cccccc', borderColor: '#333333', borderWidth: 2 } };
            }
            if (newItem) {
                setState(prev => ({ ...prev, [newId]: newItem }));
                setNextZIndex(prevZ => prevZ + 1);
            }
        }
    },
  }), [items, moveItem, setState, projectId, toolMode, viewTransform, nextZIndex]);

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

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const { deltaY } = e;
    const scaleAmount = -deltaY * 0.0005; // Fine-tuned sensitivity

    setViewTransform(prevTransform => {
        const newScale = Math.min(Math.max(0.2, prevTransform.scale + scaleAmount), 4); // Clamp scale
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate new offset to keep the point under the mouse stationary
        const newX = mouseX - (mouseX - prevTransform.x) * (newScale / prevTransform.scale);
        const newY = mouseY - (mouseY - prevTransform.y) * (newScale / prevTransform.scale);

        return { scale: newScale, x: newX, y: newY };
    });
  }, []);

  // --- Panning Logic ---
  useEffect(() => {
    // Effect for cursor style based on toolMode
    if (toolMode === 'pan') {
      document.body.classList.add('panning-active');
    } else {
      document.body.classList.remove('panning-active');
    }
    // Cleanup function to remove class when component unmounts or mode changes
    return () => {
      document.body.classList.remove('panning-active');
    };
  }, [toolMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        panState.current.isSpaceDown = true;
        document.body.classList.add('panning-active');
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        panState.current.isSpaceDown = false;
        panState.current.isPanning = false;
        document.body.classList.remove('panning-active', 'panning-grabbing');
      }
    };

    const handleMouseDown = (e) => {
      if (panState.current.isSpaceDown || toolMode === 'pan') {
        e.preventDefault();
        e.stopPropagation();
        panState.current.isPanning = true;
        panState.current.start = { x: e.clientX, y: e.clientY };
        document.body.classList.add('panning-grabbing');
      }
    };

    const handleMouseUp = () => {
      if (panState.current.isPanning) {
        panState.current.isPanning = false;
        document.body.classList.remove('panning-grabbing');
      }
    };

    const handleMouseMove = (e) => {
      if (panState.current.isPanning) {
        const dx = e.clientX - panState.current.start.x;
        const dy = e.clientY - panState.current.start.y;
        setViewTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
        panState.current.start = { x: e.clientX, y: e.clientY };
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.classList.remove('panning-active', 'panning-grabbing');
    };
  }, [toolMode]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div
      ref={canvasRef}
      className="canvas-container" // This will be styled as full-screen
      data-testid="canvas-area"
      onWheel={handleWheel}
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
        <button className="publish-button-float">Publish</button>
      </div>

      <aside className="floating-toolbar">
          <DraggableTool type={ItemTypes.TEXT} icon={<FaFont />} text="Text" />
          <ShapeTool />
          <div className="toolbar-divider-horizontal"></div>
          <button
            className={`mode-button ${toolMode === 'select' ? 'active' : ''}`}
            onClick={() => setToolMode('select')}
            title="Select & Edit Tool (V)"
          >
            <FaMousePointer />
          </button>
          <button
            className={`mode-button ${toolMode === 'pan' ? 'active' : ''}`}
            onClick={() => setToolMode('pan')}
            title="Pan Tool (H)"
          >
            <FaHandPaper />
          </button>
      </aside>

      {selectedItem && (
        <div className="floating-styling-toolbar">
          <StylingToolbar
            selectedItem={selectedItem}
            onStyleChange={handleStyleChange}
            onRotate={handleRotate}
            onBringToFront={handleBringToFront}
            onSendToBack={handleSendToBack}
          />
        </div>
      )}

      <div
        ref={drop}
        className="canvas-viewport"
        style={{ transform: `translate(${viewTransform.x}px, ${viewTransform.y}px) scale(${viewTransform.scale})`}}
        onClick={handleCanvasClick}
      >
        <AlignmentGuides guides={guides} />
        <DistanceLines lines={distanceLines} />
        {Object.values(items).sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)).map((item) => {
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