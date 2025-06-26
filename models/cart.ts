import express from 'express';
import { PrismaClient, Role } from "../db/generated/prisma";
import { authUserMiddleware } from './auth/middleware';
import { 
    calculateCartTotal, 
    updateCartTotal, 
    validateProductStock, 
    getOrCreateActiveCart,
    safeNumberConversion,
    validateRequiredFields 
} from '../utils/cartUtils';

const router = express.Router();
const prisma = new PrismaClient();
// Get cart for a user
// router.get('/:userId', async(req, res) => {
//     try {
//         const { userId } = req.params;
//         const carts = await prisma.cart.findFirst({
//             where: { user_id: Number(userId) },
//             include: {
//                 cart_items: {
//                     include: {
//                         product: true
//                     }
//                 }
//             }
//         });
//         res.json(carts || { items: [] });
//     } catch (error) {
//         console.error('Error fetching cart:', error);
//         res.status(500).json({ error: 'Failed to fetch cart' });
//     }
// })

// Add item to cart

// Add item to cart (improved with utility functions)
router.post("/add", authUserMiddleware, async (req, res): Promise<void> => {
    try {        // Validate required fields
        const validation = validateRequiredFields(req.body, ['productId', 'quantity', 'storeId']);
        if (!validation.isValid) {
            res.status(400).json({ 
                error: `Missing required fields: ${validation.missingFields.join(', ')}` 
            });
            return;
        }

        const { productId, quantity, storeId } = req.body;
        
        // Safely convert inputs to numbers
        const productIdNum = safeNumberConversion(productId, 'productId');
        const quantityNum = safeNumberConversion(quantity, 'quantity');
        const storeIdNum = safeNumberConversion(storeId, 'storeId');        if (quantityNum < 1) {
            res.status(400).json({ error: 'Quantity must be at least 1' });
            return;
        }

        // Check if product exists and belongs to the specified store
        const product = await prisma.product.findFirst({
            where: {
                id: productIdNum,
                store_id: storeIdNum
            }
        });        if (!product) {
            res.status(404).json({ error: 'Product not found in specified store' });
            return;
        }        // Validate stock availability
        const stockValidation = await validateProductStock(productIdNum, quantityNum);
        if (!stockValidation.isValid) {
            res.status(400).json({ error: stockValidation.message });
            return;
        }

        // Get or create active cart
        const cart = await getOrCreateActiveCart(req.userId, storeIdNum);

        // Check if item already exists in cart
        const existingCartItem = await prisma.cart_item.findUnique({
            where: {
                cart_id_product_id: {
                    cart_id: cart.id,
                    product_id: productIdNum
                }
            }
        });

        let cartItem;
        if (existingCartItem) {
            // Update existing item quantity
            const newQuantity = existingCartItem.quantity + quantityNum;
              // Validate total quantity against stock
            const totalStockValidation = await validateProductStock(productIdNum, newQuantity);
            if (!totalStockValidation.isValid) {
                res.status(400).json({ 
                    error: `Cannot add ${quantityNum} more items. ${totalStockValidation.message}` 
                });
                return;
            }

            cartItem = await prisma.cart_item.update({
                where: { id: existingCartItem.id },
                data: {
                    quantity: newQuantity,
                    price_at_time: product.price, // Update price to current price
                    updated_At: new Date()
                },
                include: {
                    product: {
                        select: {
                            product_name: true,
                            price: true
                        }
                    }
                }
            });
        } else {
            // Create new cart item
            cartItem = await prisma.cart_item.create({
                data: {
                    cart_id: cart.id,
                    product_id: productIdNum,
                    quantity: quantityNum,
                    price_at_time: product.price
                },
                include: {
                    product: {
                        select: {
                            product_name: true,
                            price: true
                        }
                    }
                }
            });
        }
        // Update cart total using utility function
        await updateCartTotal(cart.id);

        // Get updated cart for response
        const updatedCart = await prisma.cart.findUnique({
            where: { id: cart.id },
            select: {
                id: true,
                user_id: true,
                store_id: true,
                total_amount: true,
                status: true,
                created_At: true,
                updated_At: true
            }
        });

        res.json({
            message: existingCartItem ? 'Cart item quantity updated successfully' : 'Item added to cart successfully',
            cartItem: {
                id: cartItem.id,
                productName: cartItem.product.product_name,
                quantity: cartItem.quantity,
                priceAtTime: cartItem.price_at_time,
                itemTotal: cartItem.price_at_time * cartItem.quantity
            },
            cart: {
                id: updatedCart!.id,
                userId: updatedCart!.user_id,
                storeId: updatedCart!.store_id,
                totalAmount: updatedCart!.total_amount,
                status: updatedCart!.status,
                createdAt: updatedCart!.created_At,
                updatedAt: updatedCart!.updated_At
            }
        });

    } catch (error) {
        console.error('Error adding item to cart:', error);
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Failed to add item to cart' });
        }
    }
});

router.get("/carts", authUserMiddleware, async (req, res) => {
    try {
        const data = await prisma.cart.findMany({});
         if(!data||data.length==0){
            res.status(404).json({ error: "No carts found" });
        }
        res.json({
            "data": data.map(cart => ({
                id: cart.id,
                userId: cart.user_id,
                storeId: cart.store_id,
                totalAmount: cart.total_amount,
                status: cart.status,
                createdAt: cart.updated_At,
                updatedAt: cart.created_At
            }))
        });
       
    } catch (error) {
        console.error('Error fetching cart items:', error);
        res.status(500).json({ error: 'Failed to fetch cart items' });
    }
})

// Remove item from cart
router.delete("/remove/:cartItemId", authUserMiddleware, async (req, res): Promise<void> => {
    try {
        const { cartItemId } = req.params;

        const cartItem = await prisma.cart_item.findUnique({
            where: { id: Number(cartItemId) },
            include: { cart: true }        });

        if (!cartItem) {
            res.status(404).json({ error: 'Cart item not found' });
            return;
        }

        // Check if cart belongs to the authenticated user
        if (cartItem.cart.user_id !== req.userId) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }

        await prisma.cart_item.delete({
            where: { id: Number(cartItemId) }
        });        // Update cart total using utility function
        await updateCartTotal(cartItem.cart_id);

        res.json({ message: 'Item removed from cart successfully' });

    } catch (error) {
        console.error('Error removing item from cart:', error);
        res.status(500).json({ error: 'Failed to remove item from cart' });
    }
});

// Update cart item quantity
router.put("/update/:cartItemId", authUserMiddleware, async (req, res): Promise<void> => {
    try {
        const { cartItemId } = req.params;
        const { quantity } = req.body;        if (!quantity || quantity < 1) {
            res.status(400).json({ error: 'Valid quantity is required' });
            return;
        }

        const cartItem = await prisma.cart_item.findUnique({
            where: { id: Number(cartItemId) },
            include: { cart: true, product: true }
        });

        if (!cartItem) {
            res.status(404).json({ error: 'Cart item not found' });
            return;
        }

        // Check if cart belongs to the authenticated user
        if (cartItem.cart.user_id !== req.userId) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }

        // Check stock availability
        if (cartItem.product.stock < quantity) {
            res.status(400).json({ error: 'Insufficient stock' });
            return;
        }

        const updatedCartItem = await prisma.cart_item.update({
            where: { id: Number(cartItemId) },
            data: { quantity: Number(quantity) }
        });        // Update cart total using utility function
        await updateCartTotal(cartItem.cart_id);
        const updatedTotal = await calculateCartTotal(cartItem.cart_id);

        res.json({ 
            message: 'Cart item updated successfully', 
            cartItem: updatedCartItem,
            totalAmount: updatedTotal 
        });

    } catch (error) {
        console.error('Error updating cart item:', error);
        res.status(500).json({ error: 'Failed to update cart item' });
    }
});

// Clear entire cart
router.delete("/clear", authUserMiddleware, async (req, res): Promise<void> => {
    try {
        const cart = await prisma.cart.findFirst({
            where: { 
                user_id: req.userId,
                status: 'active'
            }
        });        if (!cart) {
            res.status(404).json({ error: 'No active cart found' });
            return;
        }

        await prisma.cart_item.deleteMany({
            where: { cart_id: cart.id }
        });

        await prisma.cart.update({
            where: { id: cart.id },
            data: { total_amount: 0 }
        });

        res.json({ message: 'Cart cleared successfully' });

    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({ error: 'Failed to clear cart' });
    }
});
const cartRoutes = router

export default cartRoutes;