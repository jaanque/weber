import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { supabase } from '../supabaseClient';
import Sidebar from '../components/editor/Sidebar';
import Canvas from '../components/editor/Canvas';
import ExportModal from '../components/editor/ExportModal'; // Importar el modal
import { generateHtml, generateCss } from '../utils/generateCode'; // Importar generadores de código

const Editor = () => {
  const { projectId } = useParams();
  const [components, setComponents] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(true);

  // Estado para el modal de exportación
  const [showExportModal, setShowExportModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState({ html: '', css: '' });

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('name, content')
        .eq('id', projectId)
        .single();

      if (error) {
        console.error('Error fetching project:', error);
        alert('Could not load the project.');
      } else if (data) {
        setProjectName(data.name);
        if (data.content && Array.isArray(data.content.components)) {
          setComponents(data.content.components);
        } else {
          setComponents([]);
        }
      }
      setLoading(false);
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const handleSave = async () => {
    const { error } = await supabase
      .from('projects')
      .update({ content: { components: components } })
      .eq('id', projectId);

    if (error) {
      alert('Error saving project: ' + error.message);
    } else {
      alert('Project saved successfully!');
    }
  };

  const handleExport = () => {
    const html = generateHtml(components);
    const css = generateCss();
    setGeneratedCode({ html, css });
    setShowExportModal(true);
  };

  if (loading) {
    return <div>Loading editor...</div>;
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)' }}>
        <div style={{ padding: '10px', borderBottom: '1px solid #ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff' }}>
          <h3>Editing: {projectName}</h3>
          <div>
            <button onClick={handleSave} style={{ marginRight: '10px' }}>Save Project</button>
            <button onClick={handleExport}>Export Code</button>
          </div>
        </div>
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <div style={{ width: '250px', borderRight: '1px solid #ccc', backgroundColor: '#f7f7f7', overflowY: 'auto' }}>
            <Sidebar />
          </div>
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', backgroundColor: '#e9e9e9' }}>
            <Canvas components={components} setComponents={setComponents} />
          </div>
        </div>
      </div>
      {showExportModal && (
        <ExportModal
          htmlCode={generatedCode.html}
          cssCode={generatedCode.css}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </DndProvider>
  );
};

export default Editor;