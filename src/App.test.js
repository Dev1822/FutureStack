import { render, screen, waitFor } from '@testing-library/react';

// react-router-dom is mapped to src/testUtils/reactRouterDomMock.js via package.json jest.moduleNameMapper
jest.mock('./hooks/useAuthToken', () => ({
    useAuthToken: jest.fn(() => ({ isLoaded: true, isSignedIn: false })),
}));
jest.mock('./services/api', () => ({
    setAuthTokenGetter: jest.fn(),
}));

import App from './App';

test('renders FutureTracker application', () => {
  render(<App />);

  // Check if the navbar is rendered
  const navbar = screen.getByRole('navigation');
  expect(navbar).toBeInTheDocument();
});

test('renders home page by default', async () => {
  render(<App />);

  await waitFor(() => {
    expect(screen.getByText(/Build Your Future,/i)).toBeInTheDocument();
  });
});
