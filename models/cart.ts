import express from 'express';
import { PrismaClient, Role } from "../db/generated/prisma";
import { authMiddleware } from './auth/middleware';
const router = express.Router();

// Example in-memory cart store (replace with DB in production)
let carts: { [userId: string]: { items: Array<{ productId: string; quantity: number }> } } = {};
let prisma = new PrismaClient();
// Get cart for a user
router.get('/:userId', async(req, res) => {
    try {
        const { userId } = req.params;
        const carts = await prisma.cart.findFirst({
            where: { user_id: Number(userId) },
            include: {
                cart_items: {
                    include: {
                        product: true
                    }
                }
            }
        });
        res.json(carts || { items: [] });
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ error: 'Failed to fetch cart' });
    }
})

// Add item to cart

// Add item to cart (supports both in-memory and DB)
router.post("/add", authMiddleware, async (req, res) => {
    try {
        const { productId, quantity, storeId } = req.body;
        
        if (!productId || !quantity || !storeId) {
            return res.status(400).json({ error: 'productId, quantity, and storeId are required' });
        }

        // Check if product exists
        const product = await prisma.product.findUnique({
            where: { id: Number(productId) }
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Check if there's enough stock
        if (product.stock < quantity) {
            return res.status(400).json({ error: 'Insufficient stock' });
        }

        // Find or create cart for user
        let cart = await prisma.cart.findFirst({
            where: { 
                user_id: req.userId,
                store_id: Number(storeId),
                status: 'active'
            }
        });

        if (!cart) {
            cart = await prisma.cart.create({
                data: {
                    user_id: req.userId,
                    store_id: Number(storeId),
                    status: 'active',
                    total_amount: 0
                }
            });
        }

        // Check if item already exists in cart
        const existingCartItem = await prisma.cart_item.findUnique({
            where: {
                cart_id_product_id: {
                    cart_id: cart.id,
                    product_id: Number(productId)
                }
            }
        });

        let cartItem;
        if (existingCartItem) {
            // Update quantity
            cartItem = await prisma.cart_item.update({
                where: { id: existingCartItem.id },
                data: {
                    quantity: existingCartItem.quantity + Number(quantity),
                    price_at_time: product.price
                }
            });
        } else {
            // Create new cart item
            cartItem = await prisma.cart_item.create({
                data: {
                    cart_id: cart.id,
                    product_id: Number(productId),
                    quantity: Number(quantity),
                    price_at_time: product.price
                }
            });
        }

        // Update cart total
        const cartItems = await prisma.cart_item.findMany({
            where: { cart_id: cart.id }
        });

        const totalAmount = cartItems.reduce((sum, item) => sum + (item.price_at_time * item.quantity), 0);
        
        await prisma.cart.update({
            where: { id: cart.id },
            data: { total_amount: totalAmount }
        });

        res.json({ 
            message: 'Item added to cart successfully', 
            cartItem,
            totalAmount 
        });

    } catch (error) {
        console.error('Error adding item to cart:', error);
        res.status(500).json({ error: 'Failed to add item to cart' });
    }
});

router.get("/carts", authMiddleware, async (req, res) => {
    try {
        const data = await prisma.cart_item.findMany();
        res.json(data);
    } catch (error) {
        console.error('Error fetching cart items:', error);
        res.status(500).json({ error: 'Failed to fetch cart items' });
    }
})

// Remove item from cart
router.delete("/remove/:cartItemId", authMiddleware, async (req, res) => {
    try {
        const { cartItemId } = req.params;

        const cartItem = await prisma.cart_item.findUnique({
            where: { id: Number(cartItemId) },
            include: { cart: true }
        });

        if (!cartItem) {
            return res.status(404).json({ error: 'Cart item not found' });
        }

        // Check if cart belongs to the authenticated user
        if (cartItem.cart.user_id !== req.userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await prisma.cart_item.delete({
            where: { id: Number(cartItemId) }
        });

        // Update cart total
        const remainingItems = await prisma.cart_item.findMany({
            where: { cart_id: cartItem.cart_id }
        });

        const totalAmount = remainingItems.reduce((sum, item) => sum + (item.price_at_time * item.quantity), 0);
        
        await prisma.cart.update({
            where: { id: cartItem.cart_id },
            data: { total_amount: totalAmount }
        });

        res.json({ message: 'Item removed from cart successfully' });

    } catch (error) {
        console.error('Error removing item from cart:', error);
        res.status(500).json({ error: 'Failed to remove item from cart' });
    }
});

// Update cart item quantity
router.put("/update/:cartItemId", authMiddleware, async (req, res) => {
    try {
        const { cartItemId } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({ error: 'Valid quantity is required' });
        }

        const cartItem = await prisma.cart_item.findUnique({
            where: { id: Number(cartItemId) },
            include: { cart: true, product: true }
        });

        if (!cartItem) {
            return res.status(404).json({ error: 'Cart item not found' });
        }

        // Check if cart belongs to the authenticated user
        if (cartItem.cart.user_id !== req.userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Check stock availability
        if (cartItem.product.stock < quantity) {
            return res.status(400).json({ error: 'Insufficient stock' });
        }

        const updatedCartItem = await prisma.cart_item.update({
            where: { id: Number(cartItemId) },
            data: { quantity: Number(quantity) }
        });

        // Update cart total
        const cartItems = await prisma.cart_item.findMany({
            where: { cart_id: cartItem.cart_id }
        });

        const totalAmount = cartItems.reduce((sum, item) => sum + (item.price_at_time * item.quantity), 0);
        
        await prisma.cart.update({
            where: { id: cartItem.cart_id },
            data: { total_amount: totalAmount }
        });

        res.json({ 
            message: 'Cart item updated successfully', 
            cartItem: updatedCartItem,
            totalAmount 
        });

    } catch (error) {
        console.error('Error updating cart item:', error);
        res.status(500).json({ error: 'Failed to update cart item' });
    }
});

// Clear entire cart
router.delete("/clear", authMiddleware, async (req, res) => {
    try {
        const cart = await prisma.cart.findFirst({
            where: { 
                user_id: req.userId,
                status: 'active'
            }
        });

        if (!cart) {
            return res.status(404).json({ error: 'No active cart found' });
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

export default router;