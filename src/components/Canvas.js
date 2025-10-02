import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDrag, useDrop } from 'react-dnd';
import { FaFont, FaTrashAlt, FaArrowLeft } from 'react-icons/fa';
import { ItemTypes } from './ItemTypes';
import { supabase } from '../supabaseClient';
import AlignmentGuides from './AlignmentGuides';
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

const DraggableDroppedItem = ({ id, left, top, text, onTextChange, onResize, width, height }) => {
    const itemRef = useRef(null);

    useEffect(() => {
        if (itemRef.current && onResize) {
            const { clientWidth, clientHeight } = itemRef.current;
            onResize(id, clientWidth, clientHeight);
        }
    }, [text, onResize, id]);

    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.TEXT,
        item: { id, left, top, type: ItemTypes.TEXT, width, height },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }), [id, left, top, width, height]);

    const handleTextChange = (e) => {
        onTextChange(id, e.target.value);
    };

    const combinedRef = (node) => {
        drag(node);
        itemRef.current = node;
    };

    return (
        <div
            ref={combinedRef}
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
  const [guides, setGuides] = useState([]);


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

  const handleResize = useCallback((id, width, height) => {
    setDroppedItems(prevItems => {
        const item = prevItems[id];
        if (item && (item.width !== width || item.height !== height)) {
            return {
                ...prevItems,
                [id]: { ...item, width, height },
            };
        }
        return prevItems;
    });
  }, []);

  const SNAP_THRESHOLD = 5;
  const canvasRef = useRef(null);
  const [, drop] = useDrop(() => ({
    accept: ItemTypes.TEXT,
    hover: (item, monitor) => {
        const dragId = item.id;
        if (!dragId || !item.width || !item.height) {
            setGuides([]);
            return;
        }

        const delta = monitor.getDifferenceFromInitialOffset();
        if (!delta) return;

        const newLeft = Math.round(item.left + delta.x);
        const newTop = Math.round(item.top + delta.y);

        const draggedItemRect = {
            left: newLeft,
            top: newTop,
            right: newLeft + item.width,
            bottom: newTop + item.height,
            centerX: newLeft + item.width / 2,
            centerY: newTop + item.height / 2,
        };

        const newGuides = [];
        const GUIDE_THRESHOLD = 6;

        for (const id in droppedItems) {
            if (String(id) === String(dragId)) continue;

            const staticItem = droppedItems[id];
            if (!staticItem.width || !staticItem.height) continue;

            const staticItemRect = {
                left: staticItem.left,
                top: staticItem.top,
                right: staticItem.left + staticItem.width,
                bottom: staticItem.top + staticItem.height,
                centerX: staticItem.left + staticItem.width / 2,
                centerY: staticItem.top + staticItem.height / 2,
            };

            const alignments = [
                { type: 'vertical', d1: 'left', d2: 'left' },
                { type: 'vertical', d1: 'centerX', d2: 'centerX' },
                { type: 'vertical', d1: 'right', d2: 'right' },
                { type: 'horizontal', d1: 'top', d2: 'top' },
                { type: 'horizontal', d1: 'centerY', d2: 'centerY' },
                { type: 'horizontal', d1: 'bottom', d2: 'bottom' },
            ];

            for (const { type, d1, d2 } of alignments) {
                if (Math.abs(draggedItemRect[d1] - staticItemRect[d2]) < GUIDE_THRESHOLD) {
                    if (type === 'vertical') {
                        const top = Math.min(draggedItemRect.top, staticItemRect.top);
                        const bottom = Math.max(draggedItemRect.bottom, staticItemRect.bottom);
                        newGuides.push({
                            orientation: 'vertical',
                            left: staticItemRect[d2],
                            top: top,
                            height: bottom - top,
                        });
                    } else {
                        const left = Math.min(draggedItemRect.left, staticItemRect.left);
                        const right = Math.max(draggedItemRect.right, staticItemRect.right);
                        newGuides.push({
                            orientation: 'horizontal',
                            top: staticItemRect[d2],
                            left: left,
                            width: right - left,
                        });
                    }
                }
            }
        }
        setGuides(newGuides);
    },
    drop: (item, monitor) => {
      setGuides([]);
      const id = item.id;
      if (!id) {
          if (canvasRef.current) {
            const canvasRect = canvasRef.current.getBoundingClientRect();
            const clientOffset = monitor.getClientOffset();
            if (clientOffset) {
              const left = Math.round(clientOffset.x - canvasRect.left);
              const top = Math.round(clientOffset.y - canvasRect.top);
              const newId = Date.now();
              setDroppedItems(prev => ({
                  ...prev,
                  [newId]: { id: newId, left, top, text: 'Text area', width: 150, height: 50 }
              }));
            }
          }
          return;
      }

      const delta = monitor.getDifferenceFromInitialOffset();
      if (!delta) return;

      let newLeft = Math.round(item.left + delta.x);
      let newTop = Math.round(item.top + delta.y);

      const draggedItem = droppedItems[id];
      if (!draggedItem || !draggedItem.width || !draggedItem.height) {
          moveItem(id, newLeft, newTop);
          return;
      }

      const draggedItemRect = {
          left: newLeft,
          top: newTop,
          right: newLeft + draggedItem.width,
          bottom: newTop + draggedItem.height,
          centerX: newLeft + draggedItem.width / 2,
          centerY: newTop + draggedItem.height / 2,
      };

      let bestSnap = { x: null, y: null, distX: SNAP_THRESHOLD, distY: SNAP_THRESHOLD };

      for (const otherId in droppedItems) {
          if (String(otherId) === String(id)) continue;

          const staticItem = droppedItems[otherId];
          if (!staticItem.width || !staticItem.height) continue;

          const staticItemRect = {
              left: staticItem.left,
              top: staticItem.top,
              right: staticItem.left + staticItem.width,
              bottom: staticItem.top + staticItem.height,
              centerX: staticItem.left + staticItem.width / 2,
              centerY: staticItem.top + staticItem.height / 2,
          };

          const xPoints = ['left', 'centerX', 'right'];
          for (const d1 of xPoints) {
              for (const d2 of xPoints) {
                  const dist = Math.abs(draggedItemRect[d1] - staticItemRect[d2]);
                  if (dist < bestSnap.distX) {
                      bestSnap.distX = dist;
                      const offset = draggedItemRect[d1] - newLeft;
                      bestSnap.x = staticItemRect[d2] - offset;
                  }
              }
          }

          const yPoints = ['top', 'centerY', 'bottom'];
          for (const d1 of yPoints) {
              for (const d2 of yPoints) {
                  const dist = Math.abs(draggedItemRect[d1] - staticItemRect[d2]);
                  if (dist < bestSnap.distY) {
                      bestSnap.distY = dist;
                      const offset = draggedItemRect[d1] - newTop;
                      bestSnap.y = staticItemRect[d2] - offset;
                  }
              }
          }
      }

      const finalLeft = bestSnap.x !== null ? Math.round(bestSnap.x) : newLeft;
      const finalTop = bestSnap.y !== null ? Math.round(bestSnap.y) : newTop;

      moveItem(id, finalLeft, finalTop);
    },
  }), [moveItem, droppedItems]);

  const [{ isOver }, trashDrop] = useDrop(() => ({
    accept: ItemTypes.TEXT,
    drop: (item) => {
      setDroppedItems(prev => {
        const newItems = { ...prev };
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
    };
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
                <AlignmentGuides guides={guides} />
                {Object.values(droppedItems).map((item) => (
                  <DraggableDroppedItem key={item.id} {...item} onTextChange={handleTextChange} onResize={handleResize} />
                ))}
            </div>
        </div>
        {isDragging && (
          <div ref={trashDrop} className={`trash-area ${isOver ? 'hovered' : ''}`}>
            <FaTrashAlt size={32} />
          </div>
        )}
    </div>
  );
};

export default Canvas;