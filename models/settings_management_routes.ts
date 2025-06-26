import express from 'express';
import {
  // Store Status Management
  toggleStoreStatus,
  getStoreStatus,
  
  // Store Hours Management
  updateStoreHours,
  getStoreHours,
  
  // Profile Management
  updateSellerProfile,
  getSellerProfile,
  
  // Bank Account Management
  addBankAccount,
  getSellerBankAccounts,
  updateBankAccount,
  deleteBankAccount,
  
  // Staff Management
  addStaffMember,
  getStoreStaff,
  updateStaffMember,
  removeStaffMember,
  
  // Password Management
  changePassword,
  
  // Session Management
  createSession,
  logout,
  getActiveSessions,
  logoutAllSessions,
  
  // Settings Overview
  getSettingsOverview
} from './settings_management_api';

const router = express.Router();

// Helper function for async error handling
const asyncHandler = (fn: Function) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ============ STORE STATUS ROUTES ============

/**
 * @route PUT /api/settings/stores/:storeId/status
 * @desc Toggle store ON/OFF status
 * @body { status: 'OPEN' | 'CLOSED' }
 */
router.put('/stores/:storeId/status', asyncHandler(toggleStoreStatus));

/**
 * @route GET /api/settings/stores/:storeId/status
 * @desc Get current store status
 */
router.get('/stores/:storeId/status', asyncHandler(getStoreStatus));

// ============ STORE HOURS ROUTES ============

/**
 * @route PUT /api/settings/stores/:storeId/hours
 * @desc Update store hours
 * @body { hours: [{ day, open_time, close_time, is_closed }] }
 */
router.put('/stores/:storeId/hours', asyncHandler(updateStoreHours));

/**
 * @route GET /api/settings/stores/:storeId/hours
 * @desc Get store hours
 */
router.get('/stores/:storeId/hours', asyncHandler(getStoreHours));

// ============ PROFILE MANAGEMENT ROUTES ============

/**
 * @route PUT /api/settings/sellers/:sellerId/profile
 * @desc Update seller profile
 * @body { name, phone, business_license, tax_id, store_name, store_address, store_phone, store_email }
 */
router.put('/sellers/:sellerId/profile', asyncHandler(updateSellerProfile));

/**
 * @route GET /api/settings/sellers/:sellerId/profile
 * @desc Get seller profile
 */
router.get('/sellers/:sellerId/profile', asyncHandler(getSellerProfile));

// ============ BANK ACCOUNT MANAGEMENT ROUTES ============

/**
 * @route POST /api/settings/sellers/:sellerId/bank-accounts
 * @desc Add bank account
 * @body { account_holder_name, bank_name, account_number, ifsc_code, branch_name, account_type, is_primary }
 */
router.post('/sellers/:sellerId/bank-accounts', asyncHandler(addBankAccount));

/**
 * @route GET /api/settings/sellers/:sellerId/bank-accounts
 * @desc Get seller bank accounts
 */
router.get('/sellers/:sellerId/bank-accounts', asyncHandler(getSellerBankAccounts));

/**
 * @route PUT /api/settings/sellers/:sellerId/bank-accounts/:accountId
 * @desc Update bank account
 * @body { account_holder_name, bank_name, ifsc_code, branch_name, is_primary }
 */
router.put('/sellers/:sellerId/bank-accounts/:accountId', asyncHandler(updateBankAccount));

/**
 * @route DELETE /api/settings/sellers/:sellerId/bank-accounts/:accountId
 * @desc Delete bank account
 */
router.delete('/sellers/:sellerId/bank-accounts/:accountId', asyncHandler(deleteBankAccount));

// ============ STAFF MANAGEMENT ROUTES ============

/**
 * @route POST /api/settings/sellers/:sellerId/stores/:storeId/staff
 * @desc Add staff member
 * @body { staff_name, staff_email, staff_phone, role, permissions }
 */
router.post('/sellers/:sellerId/stores/:storeId/staff', asyncHandler(addStaffMember));

/**
 * @route GET /api/settings/sellers/:sellerId/stores/:storeId/staff
 * @desc Get store staff members
 */
router.get('/sellers/:sellerId/stores/:storeId/staff', asyncHandler(getStoreStaff));

/**
 * @route PUT /api/settings/sellers/:sellerId/stores/:storeId/staff/:staffId
 * @desc Update staff member
 * @body { staff_name, staff_phone, role, permissions, is_active }
 */
router.put('/sellers/:sellerId/stores/:storeId/staff/:staffId', asyncHandler(updateStaffMember));

/**
 * @route DELETE /api/settings/sellers/:sellerId/stores/:storeId/staff/:staffId
 * @desc Remove staff member
 */
router.delete('/sellers/:sellerId/stores/:storeId/staff/:staffId', asyncHandler(removeStaffMember));

// ============ PASSWORD MANAGEMENT ROUTES ============

/**
 * @route PUT /api/settings/sellers/:sellerId/password
 * @desc Change password
 * @body { current_password, new_password }
 */
router.put('/sellers/:sellerId/password', asyncHandler(changePassword));

// ============ SESSION MANAGEMENT ROUTES ============

/**
 * @route POST /api/settings/sellers/:sellerId/sessions
 * @desc Create session (login)
 * @body { device_info, ip_address }
 */
router.post('/sellers/:sellerId/sessions', asyncHandler(createSession));

/**
 * @route DELETE /api/settings/sellers/:sellerId/sessions
 * @desc Logout (end session)
 * @body { session_id, logout_reason }
 */
router.delete('/sellers/:sellerId/sessions', asyncHandler(logout));

/**
 * @route GET /api/settings/sellers/:sellerId/sessions
 * @desc Get active sessions
 */
router.get('/sellers/:sellerId/sessions', asyncHandler(getActiveSessions));

/**
 * @route DELETE /api/settings/sellers/:sellerId/sessions/all
 * @desc Force logout all sessions
 */
router.delete('/sellers/:sellerId/sessions/all', asyncHandler(logoutAllSessions));

// ============ SETTINGS OVERVIEW ROUTES ============

/**
 * @route GET /api/settings/sellers/:sellerId/overview
 * @desc Get complete settings overview
 */
router.get('/sellers/:sellerId/overview', asyncHandler(getSettingsOverview));

// ============ ERROR HANDLING MIDDLEWARE ============

router.use((error: any, req: any, res: any, next: any) => {
  console.error('Settings API Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});
const settingsManagementRoutes = router;
export default settingsManagementRoutes;