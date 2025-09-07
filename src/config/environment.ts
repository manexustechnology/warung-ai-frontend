// Environment configuration
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';

// Test menus configuration - HIDDEN by default
export const showTestMenus = false; // Always hidden unless explicitly enabled

// Debug configuration
export const enableDebugLogs = isDevelopment || process.env.REACT_APP_DEBUG_LOGS === 'true';

// Test components configuration
export const enableTestComponents = isDevelopment || process.env.REACT_APP_TEST_COMPONENTS === 'true';

// Maintenance mode configuration
export const isMaintenanceMode = process.env.REACT_APP_MAINTENANCE_MODE === 'true';
