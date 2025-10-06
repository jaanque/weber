-- Add is_public column to projects table
ALTER TABLE projects
ADD COLUMN is_public BOOLEAN DEFAULT FALSE;

-- Add publication_details column to store the coordinates of the publication frame
ALTER TABLE projects
ADD COLUMN publication_details JSONB;

-- Create a new policy to allow anyone to read projects that are marked as public
CREATE POLICY "public_can_select_published_projects"
ON projects FOR SELECT
USING (is_public = TRUE);

-- Update the existing select policy to allow users to see their own projects, regardless of public status
-- This ensures that a user can always see their own projects, even if they are not public.
DROP POLICY "user_can_select_own_projects" ON projects;
CREATE POLICY "user_can_select_own_projects"
ON projects FOR SELECT
USING (auth.uid() = user_id);