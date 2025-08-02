import {type Request, type Response } from 'express';
import { PrismaClient } from '../db/generated/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// ============ STORE STATUS MANAGEMENT ============

/**
 * Toggle store ON/OFF status
 */
export const toggleStoreStatus = async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const { status } = req.body; // 'OPEN' or 'CLOSED'

    const storeIdNum = parseInt(storeId as string);
    if (isNaN(storeIdNum)) {
      return res.status(400).json({ error: 'Invalid store ID format' });
    }

    if (!['OPEN', 'CLOSED'].includes(status)) {
      return res.status(400).json({ error: 'Status must be OPEN or CLOSED' });
    }

    const updatedStore = await prisma.store.update({
      where: { id: storeIdNum },
      data: { 
        open: status,
        store_status:status,
        updated_At: new Date()
      },
      include: {
        seller: true,
        store_hours: true
      }
    });

    // Create notification for status change
    await prisma.seller_notification.create({
      data: {
        seller_id: updatedStore.seller.id,
        store_id: storeIdNum,
        category: 'SYSTEM',
        type: 'STORE_STATUS_CHANGED',
        title: `Store ${status === 'OPEN' ? 'Opened' : 'Closed'}`,
        message: `Your store "${updatedStore.name}" is now ${status.toLowerCase()}`,
        priority: 'MEDIUM'
      }
    });

    return res.json({
      message: `Store ${status === 'OPEN' ? 'opened' : 'closed'} successfully`,
      store: updatedStore
    });

  } catch (error) {
    console.error('Error toggling store status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get current store status
 */
export const getStoreStatus = async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;

    const storeIdNum = parseInt(storeId as string);
    if (isNaN(storeIdNum)) {
      return res.status(400).json({ error: 'Invalid store ID format' });
    }

    const store = await prisma.store.findUnique({
      where: { id: storeIdNum },
      select: {
        id: true,
        name: true,
        open: true,
        store_status: true,
        store_hours: true,
        updated_At: true
      }
    });

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    return res.json({ store });

  } catch (error) {
    console.error('Error getting store status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ============ STORE HOURS MANAGEMENT ============

/**
 * Update store hours
 */
export const updateStoreHours = async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const { hours } = req.body; // Array of {day, open_time, close_time, is_closed}

    const storeIdNum = parseInt(storeId as string);
    if (isNaN(storeIdNum)) {
      return res.status(400).json({ error: 'Invalid store ID format' });
    }

    if (!Array.isArray(hours) || hours.length === 0) {
      return res.status(400).json({ error: 'Hours array is required' });
    }

    // Validate hours format
    for (const hour of hours) {
      if (!hour.day || typeof hour.day !== 'string') {
        return res.status(400).json({ error: 'Day is required for each hour entry' });
      }
    }

    // Delete existing hours for the store
    await prisma.store_hours.deleteMany({
      where: { store_id: storeIdNum }
    });

    // Create new hours
    const createdHours = await Promise.all(
      hours.map(hour => 
        prisma.store_hours.create({
          data: {
            store_id: storeIdNum,
            day: hour.day,
            open_time: hour.is_closed ? null : hour.open_time,
            close_time: hour.is_closed ? null : hour.close_time,
            is_closed: hour.is_closed || false
          }
        })
      )
    );

    return res.json({
      message: 'Store hours updated successfully',
      hours: createdHours
    });

  } catch (error) {
    console.error('Error updating store hours:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get store hours
 */
export const getStoreHours = async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;

    const storeIdNum = parseInt(storeId as string);
    if (isNaN(storeIdNum)) {
      return res.status(400).json({ error: 'Invalid store ID format' });
    }

    const hours = await prisma.store_hours.findMany({
      where: { store_id: storeIdNum },
      orderBy: {
        day: 'asc'
      }
    });

    return res.json({ hours });

  } catch (error) {
    console.error('Error getting store hours:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ============ PROFILE MANAGEMENT ============

/**
 * Update seller profile
 */
export const updateSellerProfile = async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;
    const { 
      name, 
      phone, 
      business_license, 
      tax_id,
      store_name,
      store_address,
      store_phone,
      store_email
    } = req.body;

    const sellerIdNum = parseInt(sellerId as string);
    if (isNaN(sellerIdNum)) {
      return res.status(400).json({ error: 'Invalid seller ID format' });
    }

    // Get current seller data for tracking changes
    const currentSeller = await prisma.seller.findUnique({
      where: { id: sellerIdNum },
      include: { store: true }
    });

    if (!currentSeller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    // Track profile updates
    const profileUpdates: ({ seller_id: number; field_name: string; old_value: string; new_value: any; requires_verification?: undefined; } | { seller_id: number; field_name: string; old_value: string; new_value: any; requires_verification: boolean; })[] = [];

    // Update user information
    const userUpdates: any = {};
    if (name && name !== currentSeller.seller_name) {
      userUpdates.seller_name = name;
      profileUpdates.push({
        seller_id: sellerIdNum,
        field_name: 'name',
        old_value: currentSeller.seller_name || '',
        new_value: name
      });
    }

    // Update seller information
    const sellerUpdates: any = {};
    if (phone && phone !== currentSeller.seller_phone) {
      sellerUpdates.seller_phone = phone;
      profileUpdates.push({
        seller_id: sellerIdNum,
        field_name: 'phone',
        old_value: currentSeller.seller_phone,
        new_value: phone,
        requires_verification: true
      });
    }

    if (business_license && business_license !== currentSeller.business_license) {
      sellerUpdates.business_license = business_license;
      profileUpdates.push({
        seller_id: sellerIdNum,
        field_name: 'business_license',
        old_value: currentSeller.business_license || '',
        new_value: business_license,
        requires_verification: true
      });
    }

    if (tax_id && tax_id !== currentSeller.tax_id) {
      sellerUpdates.tax_id = tax_id;
      profileUpdates.push({
        seller_id: sellerIdNum,
        field_name: 'tax_id',
        old_value: currentSeller.tax_id || '',
        new_value: tax_id,
        requires_verification: true
      });
    }

    // Update store information if provided
    const storeUpdates: any = {};
    if (currentSeller.store.length > 0) {
      const currentStore = currentSeller.store[0];
      
      if (store_name && store_name !== currentStore?.name) {
        storeUpdates.name = store_name;
      }
      if (store_address && store_address !== currentStore?.address) {
        storeUpdates.address = store_address;
      }
      if (store_phone && store_phone !== currentStore?.phone) {
        storeUpdates.phone = store_phone;
      }
      if (store_email && store_email !== currentStore?.email) {
        storeUpdates.email = store_email;
      }
    }

    // Perform updates in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update seller
      if (Object.keys(userUpdates).length > 0 || Object.keys(sellerUpdates).length > 0) {
        await tx.seller.update({
          where: { id: sellerIdNum },
          data: {
            ...userUpdates,
            ...sellerUpdates,
            updated_at: new Date()
          }
        });
      }

      // Update store
      if (Object.keys(storeUpdates).length > 0 && currentSeller.store.length > 0 && currentSeller.store[0]) {
        await tx.store.update({
          where: { id: currentSeller.store[0].id },
          data: {
            ...storeUpdates,
            updated_At: new Date()
          }
        });
      }

      // Create profile update records
      if (profileUpdates.length > 0) {
        await tx.seller_profile_update.createMany({
          data: profileUpdates
        });
      }

      // Get updated seller data
      return await tx.seller.findUnique({
        where: { id: sellerIdNum },
        include: {
          store: true
        }
      });
    });

    return res.json({
      message: 'Profile updated successfully',
      seller: result,
      requires_verification: profileUpdates.some(update => update.requires_verification)
    });

  } catch (error) {
    console.error('Error updating seller profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get seller profile
 */
export const getSellerProfile = async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;

    const sellerIdNum = parseInt(sellerId as string);
    if (isNaN(sellerIdNum)) {
      return res.status(400).json({ error: 'Invalid seller ID format' });
    }

    const seller = await prisma.seller.findUnique({
      where: { id: sellerIdNum },
      include: {
        store: {
          include: {
            store_hours: true
          }
        },
        bank_accounts: {
          where: { is_active: true }
        },
        profile_updates: {
          orderBy: { created_at: 'desc' },
          take: 10
        }
      }
    });

    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    return res.json({ seller });

  } catch (error) {
    console.error('Error getting seller profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ============ BANK ACCOUNT MANAGEMENT ============

/**
 * Add bank account
 */
export const addBankAccount = async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;
    const {
      account_holder_name,
      bank_name,
      account_number,
      ifsc_code,
      branch_name,
      account_type,
      is_primary
    } = req.body;

    const sellerIdNum = parseInt(sellerId as string);
    if (isNaN(sellerIdNum)) {
      return res.status(400).json({ error: 'Invalid seller ID format' });
    }

    if (!account_holder_name || !bank_name || !account_number || !ifsc_code) {
      return res.status(400).json({ 
        error: 'Account holder name, bank name, account number, and IFSC code are required' 
      });
    }

    // If this is set as primary, remove primary flag from other accounts
    if (is_primary) {
      await prisma.seller_bank_account.updateMany({
        where: { seller_id: sellerIdNum },
        data: { is_primary: false }
      });
    }

    const bankAccount = await prisma.seller_bank_account.create({
      data: {
        seller_id: sellerIdNum,
        account_holder_name,
        bank_name,
        account_number,
        ifsc_code,
        branch_name,
        account_type: account_type || 'SAVINGS',
        is_primary: is_primary || false
      }
    });

    return res.status(201).json({
      message: 'Bank account added successfully',
      bank_account: bankAccount
    });

  } catch (error: any) {
    console.error('Error adding bank account:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'This account number already exists for this seller' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get seller bank accounts
 */
export const getSellerBankAccounts = async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;

    const sellerIdNum = parseInt(sellerId as string);
    if (isNaN(sellerIdNum)) {
      return res.status(400).json({ error: 'Invalid seller ID format' });
    }

    const bankAccounts = await prisma.seller_bank_account.findMany({
      where: { 
        seller_id: sellerIdNum,
        is_active: true
      },
      orderBy: [
        { is_primary: 'desc' },
        { created_at: 'desc' }
      ]
    });

    return res.json({ bank_accounts: bankAccounts });

  } catch (error) {
    console.error('Error getting bank accounts:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update bank account
 */
export const updateBankAccount = async (req: Request, res: Response) => {
  try {
    const { sellerId, accountId } = req.params;
    const {
      account_holder_name,
      bank_name,
      ifsc_code,
      branch_name,
      is_primary
    } = req.body;

    const sellerIdNum = parseInt(sellerId as string);
    const accountIdNum = parseInt(accountId as string);
    
    if (isNaN(sellerIdNum) || isNaN(accountIdNum)) {
      return res.status(400).json({ error: 'Invalid seller ID or account ID format' });
    }

    // If this is set as primary, remove primary flag from other accounts
    if (is_primary) {
      await prisma.seller_bank_account.updateMany({
        where: { 
          seller_id: sellerIdNum,
          id: { not: accountIdNum }
        },
        data: { is_primary: false }
      });
    }

    const updatedAccount = await prisma.seller_bank_account.update({
      where: { 
        id: accountIdNum,
        seller_id: sellerIdNum
      },
      data: {
        account_holder_name,
        bank_name,
        ifsc_code,
        branch_name,
        is_primary,
        updated_at: new Date()
      }
    });

    return res.json({
      message: 'Bank account updated successfully',
      bank_account: updatedAccount
    });

  } catch (error) {
    console.error('Error updating bank account:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete bank account
 */
export const deleteBankAccount = async (req: Request, res: Response) => {
  try {
    const { sellerId, accountId } = req.params;

    const sellerIdNum = parseInt(sellerId as string);
    const accountIdNum = parseInt(accountId as string);
    
    if (isNaN(sellerIdNum) || isNaN(accountIdNum)) {
      return res.status(400).json({ error: 'Invalid seller ID or account ID format' });
    }

    await prisma.seller_bank_account.update({
      where: { 
        id: accountIdNum,
        seller_id: sellerIdNum
      },
      data: { 
        is_active: false,
        updated_at: new Date()
      }
    });

    return res.json({ message: 'Bank account deleted successfully' });

  } catch (error) {
    console.error('Error deleting bank account:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ============ STAFF MANAGEMENT ============

/**
 * Add staff member
 */
export const addStaffMember = async (req: Request, res: Response) => {
  try {
    const { sellerId, storeId } = req.params;
    const {
      staff_name,
      staff_email,
      staff_phone,
      role,
      permissions
    } = req.body;

    const sellerIdNum = parseInt(sellerId as string);
    const storeIdNum = parseInt(storeId as string );
    
    if (isNaN(sellerIdNum) || isNaN(storeIdNum)) {
      return res.status(400).json({ error: 'Invalid seller ID or store ID format' });
    }

    if (!staff_name || !staff_email) {
      return res.status(400).json({ error: 'Staff name and email are required' });
    }

    const staffMember = await prisma.store_staff.create({
      data: {
        store_id: storeIdNum,
        seller_id: sellerIdNum,
        staff_name,
        staff_email,
        staff_phone,
        role: role || 'STAFF',
        permissions: permissions || {},
        created_by: sellerIdNum
      }
    });

    return res.status(201).json({
      message: 'Staff member added successfully',
      staff_member: staffMember
    });

  } catch (error: any) {
    console.error('Error adding staff member:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Staff email already exists' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get store staff members
 */
export const getStoreStaff = async (req: Request, res: Response) => {
  try {
    const { sellerId, storeId } = req.params;

    const sellerIdNum = parseInt(sellerId as  string);
    const storeIdNum = parseInt(storeId as string);
    
    if (isNaN(sellerIdNum) || isNaN(storeIdNum)) {
      return res.status(400).json({ error: 'Invalid seller ID or store ID format' });
    }

    const staff = await prisma.store_staff.findMany({
      where: {
        store_id: storeIdNum,
        seller_id: sellerIdNum,
        is_active: true
      },
      include: {
        created_by_seller: {
          select: { id: true, seller_phone: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    if(!staff ||staff.length==0){
        res.status(404).json({ error: 'No staff members found for this store' });
    }

    return res.json({ staff });

  } catch (error) {
    console.error('Error getting store staff:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update staff member
 */
export const updateStaffMember = async (req: Request, res: Response) => {
  try {
    const { sellerId, storeId, staffId } = req.params;
    const {
      staff_name,
      staff_phone,
      role,
      permissions,
      is_active
    } = req.body;

    const sellerIdNum = parseInt(sellerId as string);
    const storeIdNum = parseInt(storeId as string);
    const staffIdNum = parseInt(staffId as string);
    
    if (isNaN(sellerIdNum) || isNaN(storeIdNum) || isNaN(staffIdNum)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const updatedStaff = await prisma.store_staff.update({
      where: {
        id: staffIdNum,
        store_id: storeIdNum,
        seller_id: sellerIdNum
      },
      data: {
        staff_name,
        staff_phone,
        role,
        permissions,
        is_active,
        updated_at: new Date()
      }
    });

    return res.json({
      message: 'Staff member updated successfully',
      staff_member: updatedStaff
    });

  } catch (error) {
    console.error('Error updating staff member:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Remove staff member
 */
export const removeStaffMember = async (req: Request, res: Response) => {
  try {
    const { sellerId, storeId, staffId } = req.params;

    const sellerIdNum = parseInt(sellerId as string);
    const storeIdNum = parseInt(storeId as string);
    const staffIdNum = parseInt(staffId as string);
    
    if (isNaN(sellerIdNum) || isNaN(storeIdNum) || isNaN(staffIdNum)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    await prisma.store_staff.update({
      where: {
        id: staffIdNum,
        store_id: storeIdNum,
        seller_id: sellerIdNum
      },
      data: {
        is_active: false,
        updated_at: new Date()
      }
    });

    return res.json({ message: 'Staff member removed successfully' });

  } catch (error) {
    console.error('Error removing staff member:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ============ PASSWORD MANAGEMENT ============

/**
 * Change password
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;
    const { current_password, new_password } = req.body;

    const sellerIdNum = parseInt(sellerId as string);
    if (isNaN(sellerIdNum)) {
      return res.status(400).json({ error: 'Invalid seller ID format' });
    }

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Get seller with user data
    const seller = await prisma.seller.findUnique({
      where: { id: sellerIdNum }
    });

    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(current_password, seller.seller_password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(new_password, 10);

    // Update password
    await prisma.seller.update({
      where: { id: sellerIdNum },
      data: { seller_password: hashedNewPassword }
    });

    // Track profile update
    await prisma.seller_profile_update.create({
      data: {
        seller_id: sellerIdNum,
        field_name: 'password',
        old_value: 'hidden',
        new_value: 'hidden',
        update_reason: 'Password changed by user'
      }
    });

    return res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ============ SESSION MANAGEMENT ============

/**
 * Create session (login)
 */
export const createSession = async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;
    const { device_info, ip_address } = req.body;

    const sellerIdNum = parseInt(sellerId as string);
    if (isNaN(sellerIdNum)) {
      return res.status(400).json({ error: 'Invalid seller ID format' });
    }

    const seller = await prisma.seller.findUnique({
      where: { id: sellerIdNum }
    });

    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    // Create session
    const session = await prisma.seller_session.create({
      data: {
        seller_id: sellerIdNum,
        user_id: sellerIdNum, // Using seller_id as user_id since seller doesn't have separate user_id
        device_info,
        ip_address,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        sessionId: session.id,
        sellerId: sellerIdNum,
        userId: sellerIdNum // Using seller_id as user_id
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    return res.json({
      message: 'Session created successfully',
      token,
      session_id: session.id,
      expires_at: session.expires_at
    });

  } catch (error) {
    console.error('Error creating session:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Logout (end session)
 */
export const logout = async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;
    const { session_id, logout_reason } = req.body;

    const sellerIdNum = parseInt(sellerId as string);
    if (isNaN(sellerIdNum)) {
      return res.status(400).json({ error: 'Invalid seller ID format' });
    }

    if (!session_id) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // End the session
    await prisma.seller_session.update({
      where: {
        id: session_id,
        seller_id: sellerIdNum
      },
      data: {
        is_active: false,
        logout_time: new Date(),
        logout_reason: logout_reason || 'manual'
      }
    });

    return res.json({ message: 'Logged out successfully' });

  } catch (error) {
    console.error('Error during logout:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get active sessions
 */
export const getActiveSessions = async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;

    const sellerIdNum = parseInt(sellerId as string);
    if (isNaN(sellerIdNum)) {
      return res.status(400).json({ error: 'Invalid seller ID format' });
    }

    const sessions = await prisma.seller_session.findMany({
      where: {
        seller_id: sellerIdNum,
        is_active: true,
        expires_at: { gt: new Date() }
      },
      orderBy: { last_activity: 'desc' }
    });

    return res.json({ sessions });

  } catch (error) {
    console.error('Error getting active sessions:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Force logout all sessions
 */
export const logoutAllSessions = async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;

    const sellerIdNum = parseInt(sellerId);
    if (isNaN(sellerIdNum)) {
      return res.status(400).json({ error: 'Invalid seller ID format' });
    }

    await prisma.seller_session.updateMany({
      where: {
        seller_id: sellerIdNum,
        is_active: true
      },
      data: {
        is_active: false,
        logout_time: new Date(),
        logout_reason: 'force_logout_all'
      }
    });

    return res.json({ message: 'All sessions logged out successfully' });

  } catch (error) {
    console.error('Error during force logout:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ============ SETTINGS OVERVIEW ============

/**
 * Get complete settings overview
 */
export const getSettingsOverview = async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;

    const sellerIdNum = parseInt(sellerId);
    if (isNaN(sellerIdNum)) {
      return res.status(400).json({ error: 'Invalid seller ID format' });
    }

    const seller = await prisma.seller.findUnique({
      where: { id: sellerIdNum },
      include: {
        store: {
          include: {
            store_hours: true
          }
        },
        bank_accounts: {
          where: { is_active: true },
          orderBy: { is_primary: 'desc' }
        },
        staff_members: {
          where: { is_active: true },
          orderBy: { created_at: 'desc' }
        },
        sessions: {
          where: { 
            is_active: true,
            expires_at: { gt: new Date() }
          },
          orderBy: { last_activity: 'desc' }
        },
        notification_preferences: true
      }
    });

    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    return res.json({
      seller: {
        ...seller,
        // Create a user-like object from seller data for backward compatibility
        user: {
          id: seller.id,
          name: seller.seller_name,
          email: seller.seller_email,
          phone: seller.seller_phone,
          created_At: seller.created_at
        }
      }
    });

  } catch (error) {
    console.error('Error getting settings overview:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};