import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n.ts';
import Loader from './components/ui/Loader';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center">
        <Loader />
      </div>
    }>
      <App />
    </Suspense>
  </React.StrictMode>,
)
