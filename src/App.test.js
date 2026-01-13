import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

test('renders FutureTracker application', () => {
  render(<App />);

  // Check if the navbar is rendered
  const navbar = screen.getByRole('navigation');
  expect(navbar).toBeInTheDocument();
});

test('renders home page by default', async () => {
  render(<App />);

  // Check for home page content
  await waitFor(() => {
    expect(screen.getByText(/Build your future/i)).toBeInTheDocument();
  });
});
