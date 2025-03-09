import React from 'react';
import ReactDOM from 'react-dom/client';
import OptionsPage from './OptionsPage';
import './styles.css';

// Render the Options page
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <React.StrictMode>
        <OptionsPage />
    </React.StrictMode>
); 