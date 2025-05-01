// Application Configuration
const APP_CONFIG = {
    name: 'SINC Legal Management',
    version: '1.0.0',
    apiBaseUrl: 'https://api.example.com/v1', // Replace with your actual API URL
    defaultRoute: 'dashboard',
    routes: {
        dashboard: {
            title: 'Dashboard',
            icon: 'th-large',
            path: '/dashboard',
            jsModule: 'js/modules/dashboard.js'
        },
        cases: {
            title: 'Case Files',
            icon: 'folder',
            path: '/cases',
            jsModule: 'js/modules/cases.js'
        },
        clients: {
            title: 'Clients',
            icon: 'users',
            path: '/clients',
            jsModule: 'js/modules/clients.js'
        },
        calendar: {
            title: 'Calendar',
            icon: 'calendar-alt',
            path: '/calendar',
            jsModule: 'js/modules/calendar.js'
        },
        documents: {
            title: 'Documents',
            icon: 'file-alt',
            path: '/documents',
            jsModule: 'js/modules/documents.js'
        },
        tasks: {
            title: 'Tasks',
            icon: 'tasks',
            path: '/tasks',
            jsModule: 'js/modules/tasks.js'
        },
        time: {
            title: 'Time Tracking',
            icon: 'clock',
            path: '/time',
            jsModule: 'js/modules/time.js'
        },
        billing: {
            title: 'Billing',
            icon: 'file-invoice-dollar',
            path: '/billing',
            jsModule: 'js/modules/billing.js'
        },
        assistant: {
            title: 'AI Assistant',
            icon: 'robot',
            path: '/assistant',
            jsModule: 'js/modules/assistant.js'
        },
        settings: {
            title: 'Settings',
            icon: 'cog',
            path: '/settings',
            jsModule: 'js/modules/settings.js'
        }
    }
};