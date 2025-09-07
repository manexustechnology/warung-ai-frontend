// Maintenance configuration for developers
export const maintenanceConfig = {
  // Set to true to show test menus for maintenance/debugging
  showTestMenus: false, // HIDDEN by default
  
  // Set to true to enable debug logs
  enableDebugLogs: false,
  
  // Set to true to show test components
  enableTestComponents: false,
  
  // Instructions for enabling test menus:
  // 1. Set showTestMenus: true
  // 2. Save file
  // 3. Refresh browser
  // 4. Test menus will appear in header
  // 5. Set back to false when done
};

// Helper function to check if test menus should be shown
export const shouldShowTestMenus = () => {
  // Only show test menus if explicitly enabled
  return maintenanceConfig.showTestMenus || 
         process.env.REACT_APP_SHOW_TEST_MENUS === 'true' ||
         process.env.REACT_APP_MAINTENANCE_MODE === 'true';
  // Removed NODE_ENV === 'development' to hide in development too
};
