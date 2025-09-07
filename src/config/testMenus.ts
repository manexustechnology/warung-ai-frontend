// Test Menus Configuration
// This file controls the visibility of test menus in the header

// Default: HIDDEN
const DEFAULT_SHOW_TEST_MENUS = false;

// Check if test menus should be shown
export const shouldShowTestMenus = (): boolean => {
  // Check environment variables first
  if (process.env.REACT_APP_SHOW_TEST_MENUS === 'true') {
    console.log('🔧 Test menus enabled via REACT_APP_SHOW_TEST_MENUS');
    return true;
  }
  
  if (process.env.REACT_APP_MAINTENANCE_MODE === 'true') {
    console.log('🔧 Test menus enabled via REACT_APP_MAINTENANCE_MODE');
    return true;
  }
  
  // Check maintenance config
  try {
    const maintenanceConfig = require('./maintenance').maintenanceConfig;
    if (maintenanceConfig.showTestMenus === true) {
      console.log('🔧 Test menus enabled via maintenance config');
      return true;
    }
  } catch (error) {
    console.log('🔧 Could not load maintenance config, using default');
  }
  
  // Default: HIDDEN
  console.log('🔧 Test menus HIDDEN (default behavior)');
  return DEFAULT_SHOW_TEST_MENUS;
};

// Helper function to force show test menus (for debugging)
export const forceShowTestMenus = (): boolean => {
  console.log('🔧 Test menus FORCED to show');
  return true;
};

// Helper function to force hide test menus (for production)
export const forceHideTestMenus = (): boolean => {
  console.log('🔧 Test menus FORCED to hide');
  return false;
};
