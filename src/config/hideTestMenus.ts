// Simple configuration to hide test menus
// This file ensures test menus are HIDDEN by default

export const HIDE_TEST_MENUS = true; // Always hide test menus

// Function to check if test menus should be shown
export const shouldShowTestMenus = (): boolean => {
  // Check if explicitly enabled via environment variables
  if (process.env.REACT_APP_SHOW_TEST_MENUS === 'true') {
    console.log('🔧 Test menus enabled via REACT_APP_SHOW_TEST_MENUS');
    return true;
  }
  
  if (process.env.REACT_APP_MAINTENANCE_MODE === 'true') {
    console.log('🔧 Test menus enabled via REACT_APP_MAINTENANCE_MODE');
    return true;
  }
  
  // Default: HIDDEN
  console.log('🔧 Test menus HIDDEN (default behavior)');
  return false;
};
