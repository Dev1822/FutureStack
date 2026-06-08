import React from 'react';

export const BrowserRouter = ({ children }) => React.createElement('div', null, children);
export const Routes = ({ children }) => {
    let matched = null;
    React.Children.forEach(children, (child) => {
        if (child?.props?.path === '/') {
            matched = child.props.element;
        }
    });
    return matched;
};
export const Route = () => null;
export const Link = ({ children, to }) => React.createElement('a', { href: to }, children);
export const Navigate = () => null;
export const useLocation = () => ({
    pathname: '/',
    search: '',
    hash: '',
    state: null,
    key: 'default',
});
export const useNavigate = () => jest.fn();
