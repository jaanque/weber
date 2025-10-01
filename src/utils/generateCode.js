// Función para generar el código HTML a partir de los componentes
function generateHtml(components) {
  const bodyContent = components.map(comp => {
    switch (comp.type) {
      case 'heading':
        return `    <h1>${comp.content || 'Heading'}</h1>`;
      case 'paragraph':
        return `    <p>${comp.content || 'This is a paragraph.'}</p>`;
      case 'image':
        return `    <img src="${comp.src || 'https://via.placeholder.com/400x200'}" alt="User image" />`;
      default:
        return '';
    }
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Weber Page</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
${bodyContent}
</body>
</html>`;
}

// Función para generar el código CSS
function generateCss() {
  return `body {
  font-family: sans-serif;
  line-height: 1.6;
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  color: #333;
}

h1 {
  color: #111;
}

img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin-top: 10px;
  margin-bottom: 10px;
}
`;
}

export { generateHtml, generateCss };