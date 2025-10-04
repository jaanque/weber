import { useState, useCallback } from 'react';

const useUndoRedo = (initialHistory = {}) => {
  const [history, setHistory] = useState({
    past: initialHistory.past || [],
    present: initialHistory.present || {},
    future: initialHistory.future || [],
  });

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const undo = useCallback(() => {
    if (!canUndo) return;
    setHistory(currentHistory => {
        const newPast = currentHistory.past.slice(0, currentHistory.past.length - 1);
        const newPresent = currentHistory.past[currentHistory.past.length - 1];
        const newFuture = [currentHistory.present, ...currentHistory.future];
        return { past: newPast, present: newPresent, future: newFuture };
    });
  }, [canUndo]);

  const redo = useCallback(() => {
    if (!canRedo) return;
    setHistory(currentHistory => {
        const newPast = [...currentHistory.past, currentHistory.present];
        const newPresent = currentHistory.future[0];
        const newFuture = currentHistory.future.slice(1);
        return { past: newPast, present: newPresent, future: newFuture };
    });
  }, [canRedo]);

  const setState = useCallback((newStateOrFn) => {
    setHistory(currentHistory => {
      const newState = typeof newStateOrFn === 'function'
        ? newStateOrFn(currentHistory.present)
        : newStateOrFn;

      if (JSON.stringify(newState) === JSON.stringify(currentHistory.present)) {
        return currentHistory;
      }

      return {
        past: [...currentHistory.past, currentHistory.present],
        present: newState,
        future: [],
      };
    });
  }, []);

  const setPresent = useCallback((newStateOrFn) => {
    setHistory(h => {
        const newState = typeof newStateOrFn === 'function'
            ? newStateOrFn(h.present)
            : newStateOrFn;
        return {...h, present: newState};
    });
  }, []);

  const resetHistory = useCallback((newInitialHistory) => {
    setHistory({
      past: newInitialHistory.past || [],
      present: newInitialHistory.present || {},
      future: newInitialHistory.future || [],
    });
  }, []);

  return {
    state: history.present,
    past: history.past,
    future: history.future,
    setState,
    setPresent,
    resetHistory,
    undo,
    redo,
    canUndo,
    canRedo,
  };
};

export default useUndoRedo;