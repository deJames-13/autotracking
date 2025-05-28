import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';
import { Toaster } from 'react-hot-toast';
import { toast } from 'react-hot-toast';

const appName = import.meta.env.VITE_APP_NAME || 'AmkorTracking';

// Add global event listener for handling success messages
document.addEventListener('inertia:success', (event) => {
    // @ts-ignore
    const successMessage = event.detail?.page?.props?.flash?.success;
    if (successMessage) {
        toast.success(successMessage);
    }
});

// Add global event listener for handling error messages
document.addEventListener('inertia:error', (event) => {
    // @ts-ignore
    const errorMessage = event.detail?.page?.props?.flash?.error;
    if (errorMessage) {
        toast.error(errorMessage);
    }
});

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        // Wrap App with Toaster component
        root.render(
            <>
                <Toaster position="top-right" />
                <App {...props} />
            </>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
