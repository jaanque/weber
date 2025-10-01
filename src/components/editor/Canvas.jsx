import React from 'react';
import { useDrop } from 'react-dnd';

// Componente para renderizar los elementos en el lienzo
const renderComponent = (component) => {
  // Aquí podríamos añadir más lógica para la edición de contenido en el futuro
  switch (component.type) {
    case 'heading':
      return <h1 key={component.id}>{component.content || 'Heading'}</h1>;
    case 'paragraph':
      return <p key={component.id}>{component.content || 'Paragraph text.'}</p>;
    case 'image':
      return <img key={component.id} src={component.src || 'https://via.placeholder.com/150'} alt="placeholder" style={{ maxWidth: '100%' }} />;
    default:
      return null;
  }
};

const Canvas = ({ components, setComponents }) => {
  const [, drop] = useDrop(() => ({
    accept: Object.values(require('./types').ItemTypes),
    drop: (item) => {
      // Cuando un ítem se suelta, lo añadimos a la lista de componentes.
      // Usamos un ID único basado en la fecha para la clave `key`.
      const newComponent = { ...item, id: Date.now() };
      setComponents((prev) => [...prev, newComponent]);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop}
      style={{
        minHeight: '100%',
        border: '2px dashed #ccc',
        backgroundColor: 'white',
        padding: '20px',
      }}
    >
      {components.length === 0 && <p>Drop components here to build your page</p>}
      {components.map((component, index) => renderComponent(component, index))}
    </div>
  );
};

export default Canvas;