import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

test('renders login page when not authenticated', async () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );
  const headingElement = await screen.findByRole('heading', { name: /login/i });
  expect(headingElement).toBeInTheDocument();
});