import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Canvas from './Canvas';
import { supabase } from '../supabaseClient';

// Mock Supabase client
jest.mock('../supabaseClient', () => {
    const fromBuilder = {
        select: jest.fn(),
        insert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        eq: jest.fn(),
        single: jest.fn(),
    };

    const mockSupabase = {
        from: jest.fn().mockReturnValue(fromBuilder),
        auth: {
            getUser: jest.fn().mockResolvedValue({
                data: { user: { id: 'test-user-id' } }
            }),
        },
        // Expose the builder for easy access in tests
        __fromBuilder: fromBuilder,
    };

    return { supabase: mockSupabase };
});

const renderCanvas = () => {
  render(
    <DndProvider backend={HTML5Backend}>
      <MemoryRouter initialEntries={['/projects/1']}>
        <Routes>
            <Route path="/projects/:projectId" element={<Canvas />} />
        </Routes>
      </MemoryRouter>
    </DndProvider>
  );
};

describe('Canvas Component', () => {
  const mockedFromBuilder = supabase.__fromBuilder;

  beforeEach(() => {
    // Clear the history of all mock functions before each test
    jest.clearAllMocks();

    // Restore default mock implementations for each test
    mockedFromBuilder.select.mockReturnThis();
    mockedFromBuilder.insert.mockReturnThis();
    mockedFromBuilder.update.mockReturnThis();
    mockedFromBuilder.delete.mockReturnThis();
    mockedFromBuilder.eq.mockReturnThis();

    mockedFromBuilder.single.mockResolvedValue({ data: { name: 'Test Project' }, error: null });
    mockedFromBuilder.select.mockImplementation(() => {
        if (supabase.from.mock.lastCall[0] === 'canvas_items') {
            return Promise.resolve({ data: [], error: null });
        }
        return mockedFromBuilder;
    });
    mockedFromBuilder.insert.mockImplementation((items) => ({
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { ...items[0], id: Date.now(), left_pos: items[0].left, top_pos: items[0].top }, error: null }),
    }));
    mockedFromBuilder.update.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: [{}], error: null }),
    });
  });

  test('renders canvas and fetches initial data', async () => {
    renderCanvas();
    expect(await screen.findByText('Test Project')).toBeInTheDocument();
    expect(supabase.from).toHaveBeenCalledWith('projects');
    expect(supabase.from).toHaveBeenCalledWith('canvas_items');
  });

  test('adds a new text box when the text tool is dropped', async () => {
    renderCanvas();
    const canvasArea = screen.getByTestId('canvas-area');
    const textTool = screen.getByText('Text');

    fireEvent.dragStart(textTool);
    fireEvent.drop(canvasArea);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Text area')).toBeInTheDocument();
    });

    await waitFor(() => {
        expect(mockedFromBuilder.insert).toHaveBeenCalledTimes(1);
    });
  });

  test('updates text box content on input', async () => {
    renderCanvas();
    const canvasArea = screen.getByTestId('canvas-area');
    const textTool = screen.getByText('Text');

    fireEvent.dragStart(textTool);
    fireEvent.drop(canvasArea);

    const textArea = await screen.findByDisplayValue('Text area');
    fireEvent.change(textArea, { target: { value: 'New text content' } });

    expect(textArea.value).toBe('New text content');

    await waitFor(() => {
        expect(mockedFromBuilder.update).toHaveBeenCalledTimes(1);
    }, { timeout: 1000 });
  });

  test('shows styling toolbar when a text box is selected', async () => {
    renderCanvas();
    const canvasArea = screen.getByTestId('canvas-area');
    const textTool = screen.getByText('Text');

    fireEvent.dragStart(textTool);
    fireEvent.drop(canvasArea);

    const textBox = await screen.findByDisplayValue('Text area');
    fireEvent.click(textBox);

    const boldButton = screen.getByRole('button', { name: /bold/i });
    const italicButton = screen.getByRole('button', { name: /italic/i });
    expect(boldButton).toBeInTheDocument();
    expect(italicButton).toBeInTheDocument();
  });

  test('applies bold style when bold button is clicked', async () => {
    renderCanvas();
    const canvasArea = screen.getByTestId('canvas-area');
    const textTool = screen.getByText('Text');

    fireEvent.dragStart(textTool);
    fireEvent.drop(canvasArea);

    const textBox = await screen.findByDisplayValue('Text area');
    fireEvent.click(textBox);

    const boldButton = screen.getByRole('button', { name: /bold/i });
    fireEvent.click(boldButton);

    await waitFor(() => {
        expect(mockedFromBuilder.update).toHaveBeenCalledWith(expect.objectContaining({
            style: expect.objectContaining({ fontWeight: 'bold' })
        }));
    });
  });
});