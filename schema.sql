-- 1. Crear la tabla para los proyectos
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name VARCHAR(255) NOT NULL,
  content JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar la Seguridad a Nivel de Fila (RLS)
-- Esto asegura que los datos estén protegidos por defecto.
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas de seguridad
-- Estas reglas permiten a los usuarios acceder y modificar SOLO sus propios proyectos.

-- Permite a los usuarios leer sus propios proyectos
CREATE POLICY "Allow users to view their own projects"
ON projects FOR SELECT
USING (auth.uid() = user_id);

-- Permite a los usuarios crear proyectos para sí mismos
CREATE POLICY "Allow users to create their own projects"
ON projects FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Permite a los usuarios actualizar sus propios proyectos
CREATE POLICY "Allow users to update their own projects"
ON projects FOR UPDATE
USING (auth.uid() = user_id);

-- Permite a los usuarios eliminar sus propios proyectos
CREATE POLICY "Allow users to delete their own projects"
ON projects FOR DELETE
USING (auth.uid() = user_id);