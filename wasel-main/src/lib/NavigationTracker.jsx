import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { base44 } from '@/api/base44Client';
import { pagesConfig } from '@/pages.config';
import { logScreenView } from '@/services/analytics'; // Analytics Integration
import { trackPageVisit, trackPageDwell } from '@/lib/recommendationSignals';

export default function NavigationTracker() {
    const location = useLocation();
    const { isAuthenticated } = useAuth();
    const { Pages, mainPage } = pagesConfig;
    const mainPageKey = mainPage ?? Object.keys(Pages)[0];
    const previousPageRef = useRef(null);
    const enteredAtRef = useRef(Date.now());

    // Log user activity when navigating to a page
    useEffect(() => {
        // Extract page name from pathname
        const pathname = location.pathname;
        let pageName;

        if (pathname === '/' || pathname === '') {
            pageName = mainPageKey;
        } else {
            // Remove leading slash and get the first segment
            const pathSegment = pathname.replace(/^\//, '').split('/')[0];

            // Try case-insensitive lookup in Pages config
            const pageKeys = Object.keys(Pages);
            const matchedKey = pageKeys.find(
                key => key.toLowerCase() === pathSegment.toLowerCase()
            );

            pageName = matchedKey || null;
        }

        if (pageName) {
            // FIREBASE ANALYTICS
            logScreenView(pageName);
            trackPageVisit(pageName);

            const previousPage = previousPageRef.current;
            if (previousPage) {
                trackPageDwell(previousPage, Date.now() - enteredAtRef.current);
            }

            previousPageRef.current = pageName;
            enteredAtRef.current = Date.now();
        }

        if (isAuthenticated && pageName) {
            const logUserInApp = base44?.appLogs?.logUserInApp;
            if (typeof logUserInApp === 'function') {
                Promise.resolve(logUserInApp(pageName)).catch(() => {
                    // Silently fail - logging shouldn't break the app
                });
            }
        }
    }, [location, isAuthenticated, Pages, mainPageKey]);

    useEffect(() => {
        return () => {
            const previousPage = previousPageRef.current;
            if (previousPage) {
                trackPageDwell(previousPage, Date.now() - enteredAtRef.current);
            }
        };
    }, []);

    return null;
}