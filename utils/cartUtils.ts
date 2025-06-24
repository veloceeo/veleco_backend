import { PrismaClient } from "../db/generated/prisma";

const prisma = new PrismaClient();

/**
 * Calculate total amount for a cart based on its cart items
 * @param cartId - The ID of the cart
 * @returns Promise<number> - The calculated total amount
 */
export async function calculateCartTotal(cartId: number): Promise<number> {
    try {
        const cartItems = await prisma.cart_item.findMany({
            where: { cart_id: cartId }
        });

        // Calculate total using reduce with proper type handling
        const total = cartItems.reduce((sum, item) => {
            const itemTotal = Number(item.price_at_time) * Number(item.quantity);
            return sum + itemTotal;
        }, 0);

        return Math.round(total); // Round to handle any floating point precision issues
    } catch (error) {
        console.error('Error calculating cart total:', error);
        throw new Error('Failed to calculate cart total');
    }
}

/**
 * Update cart total amount in the database
 * @param cartId - The ID of the cart to update
 * @returns Promise<void>
 */
export async function updateCartTotal(cartId: number): Promise<void> {
    try {
        const totalAmount = await calculateCartTotal(cartId);
        
        await prisma.cart.update({
            where: { id: cartId },
            data: { total_amount: totalAmount }
        });
    } catch (error) {
        console.error('Error updating cart total:', error);
        throw new Error('Failed to update cart total');
    }
}

/**
 * Validate product stock before adding to cart
 * @param productId - The ID of the product
 * @param requestedQuantity - The quantity requested
 * @param existingQuantity - Any existing quantity in cart (for updates)
 * @returns Promise<boolean> - Whether the stock is sufficient
 */
export async function validateProductStock(
    productId: number, 
    requestedQuantity: number, 
    existingQuantity: number = 0
): Promise<{ isValid: boolean; availableStock: number; message?: string }> {
    try {
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { stock: true, product_name: true }
        });

        if (!product) {
            return {
                isValid: false,
                availableStock: 0,
                message: 'Product not found'
            };
        }

        const totalRequiredQuantity = requestedQuantity - existingQuantity;
        const isValid = product.stock >= totalRequiredQuantity;

        return {
            isValid,
            availableStock: product.stock,
            message: isValid ? undefined : `Insufficient stock. Only ${product.stock} items available for ${product.product_name}`
        };
    } catch (error) {
        console.error('Error validating product stock:', error);
        return {
            isValid: false,
            availableStock: 0,
            message: 'Error validating stock'
        };
    }
}

/**
 * Get or create active cart for user and store
 * @param userId - The user ID
 * @param storeId - The store ID
 * @returns Promise<Cart> - The active cart
 */
export async function getOrCreateActiveCart(userId: number, storeId: number) {
    try {
        // Try to find existing active cart
        let cart = await prisma.cart.findFirst({
            where: {
                user_id: userId,
                store_id: storeId,
                status: 'active'
            }
        });

        // Create new cart if none exists
        if (!cart) {
            cart = await prisma.cart.create({
                data: {
                    user_id: userId,
                    store_id: storeId,
                    status: 'active',
                    total_amount: 0
                }
            });
        }

        return cart;
    } catch (error) {
        console.error('Error getting or creating cart:', error);
        throw new Error('Failed to get or create cart');
    }
}

/**
 * Safe number conversion with validation
 * @param value - Value to convert
 * @param fieldName - Name of the field for error messages
 * @returns number - The converted number
 */
export function safeNumberConversion(value: any, fieldName: string): number {
    const num = Number(value);
    if (isNaN(num) || num < 0) {
        throw new Error(`Invalid ${fieldName}: must be a valid positive number`);
    }
    return num;
}

/**
 * Validate required fields in request body
 * @param body - Request body
 * @param requiredFields - Array of required field names
 * @returns { isValid: boolean, missingFields: string[] }
 */
export function validateRequiredFields(body: any, requiredFields: string[]): { isValid: boolean, missingFields: string[] } {
    const missingFields: string[] = [];
    
    for (const field of requiredFields) {
        if (!body || body[field] === undefined || body[field] === null || body[field] === '') {
            missingFields.push(field);
        }
    }
    
    return {
        isValid: missingFields.length === 0,
        missingFields
    };
}
