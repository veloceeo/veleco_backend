import express from 'express';
import { PrismaClient } from "../db/generated/prisma";
import { authMiddleware } from './auth/middleware';

const cart_items = express.Router();
const prisma = new PrismaClient();

// Add JSON parsing middleware
cart_items.use(express.json());

cart_items.get("/", authMiddleware, async (req, res) => {
    try {
        const cartItems = await prisma.cart_item.findMany({
            where: {
                cart: {
                    user_id: req.userId,
                    status: 'active'
                }
            },
            include: {
                product: {
                    select: {
                        id: true,
                        product_name: true,
                        price: true,
                        product_img: true,
                        category: true,
                        stock: true
                    }
                },
                cart: {
                    select: {
                        id: true,
                        total_amount: true,
                        store_id: true
                    }
                }
            },
            orderBy: {
                created_At: 'desc'
            }
        });

        res.json({
            message: "Cart items fetched successfully",
            items: cartItems,
            totalItems: cartItems.length,
            totalAmount: cartItems.reduce((sum, item) => sum + (item.price_at_time * item.quantity), 0)
        });
    } catch (error) {
        console.error('Error fetching cart items:', error);
        res.status(500).json({ error: 'Failed to fetch cart items' });
    }
});

// Get cart items by cart ID
cart_items.get("/cart/:cartId", authMiddleware, async (req, res) => {
    try {
        const { cartId } = req.params;

        // Verify cart belongs to user
        const cart = await prisma.cart.findFirst({
            where: {
                id: Number(cartId),
                user_id: req.userId
            }
        });

        if (!cart) {
            return res.status(404).json({ error: 'Cart not found or unauthorized' });
        }

        const cartItems = await prisma.cart_item.findMany({
            where: {
                cart_id: Number(cartId)
            },
            include: {
                product: true
            },
            orderBy: {
                created_At: 'desc'
            }
        });

        res.json({
            message: "Cart items fetched successfully",
            cartId: Number(cartId),
            items: cartItems,
            totalItems: cartItems.length
        });
    } catch (error) {
        console.error('Error fetching cart items by cart ID:', error);
        res.status(500).json({ error: 'Failed to fetch cart items' });
    }
});

// Get specific cart item by ID
cart_items.get("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const cartItem = await prisma.cart_item.findUnique({
            where: { id: Number(id) },
            include: {
                product: true,
                cart: {
                    select: {
                        id: true,
                        user_id: true,
                        store_id: true,
                        total_amount: true
                    }
                }
            }
        });

        if (!cartItem) {
            return res.status(404).json({ error: 'Cart item not found' });
        }

        // Check if cart belongs to authenticated user
        if (cartItem.cart.user_id !== req.userId) {
            return res.status(403).json({ error: 'Unauthorized access' });
        }

        res.json({
            message: "Cart item fetched successfully",
            item: cartItem
        });
    } catch (error) {
        console.error('Error fetching cart item:', error);
        res.status(500).json({ error: 'Failed to fetch cart item' });
    }
});

// Add item to cart
cart_items.post("/add", authMiddleware, async (req, res) => {
    try {
        // Check if req.body exists and is an object
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({ error: 'Request body is required' });
        }

        const { product_id, quantity, store_id } = req.body;
        
        if (!product_id || !quantity || !store_id) {
            return res.status(400).json({ error: 'Product ID, quantity, and store ID are required' });
        }

        // Validate data types
        if (isNaN(Number(product_id)) || isNaN(Number(quantity)) || isNaN(Number(store_id))) {
            return res.status(400).json({ error: 'Product ID, quantity, and store ID must be valid numbers' });
        }

        if (Number(quantity) < 1) {
            return res.status(400).json({ error: 'Quantity must be at least 1' });
        }        const cart = await prisma.cart.findFirst({
            where: {
                user_id: req.userId,
                store_id: Number(store_id),
                status: 'active'
            }
        });

        if (!cart) {
             res.status(404).json({ error: 'Active cart not found for this store' });
        }

        const product = await prisma.product.findUnique({
            where: { id: Number(product_id) }
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (product.stock < quantity) {
            return res.status(400).json({ error: `Insufficient stock. Only ${product.stock} items available` });
        }

        // Check if item already exists in cart
        const existingCartItem = await prisma.cart_item.findFirst({
            where: {
                cart_id: cart.id,
                product_id: Number(product_id)
            }
        });

        let data;
        if (existingCartItem) {
            // Update quantity if already exists
            data = await prisma.cart_item.update({
                where: { id: existingCartItem.id },
                data: {
                    quantity: existingCartItem.quantity + Number(quantity),
                    updated_At: new Date()
                }
            });
        } else {
            // Create new cart item
            data = await prisma.cart_item.create({
                data: {
                    cart_id: cart.id,
                    product_id: Number(product_id),
                    quantity: Number(quantity),
                    price_at_time: product.price,
                    created_At: new Date(),
                    updated_At: new Date()
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
        });        res.json({
            message: "Item added to cart successfully",
            data
        });

    } catch (error) {
        console.error('Error adding item to cart:', error);
        res.status(500).json({ error: 'Failed to add item to cart' });
    }
});

// Update cart item quantity
cart_items.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({ error: 'Valid quantity (minimum 1) is required' });
        }

        // Get cart item with related data
        const cartItem = await prisma.cart_item.findUnique({
            where: { id: Number(id) },
            include: {
                cart: true,
                product: {
                    select: {
                        id: true,
                        product_name: true,
                        price: true,
                        stock: true
                    }
                }
            }
        });

        if (!cartItem) {
            return res.status(404).json({ error: 'Cart item not found' });
        }

        // Check authorization
        if (cartItem.cart.user_id !== req.userId) {
            return res.status(403).json({ error: 'Unauthorized access' });
        }

        // Check stock availability
        if (cartItem.product.stock < quantity) {
            return res.status(400).json({ 
                error: `Insufficient stock. Only ${cartItem.product.stock} items available` 
            });
        }

        // Update cart item
        const updatedCartItem = await prisma.cart_item.update({
            where: { id: Number(id) },
            data: {
                quantity: Number(quantity),
                updated_At: new Date()
            },
            include: {
                product: true
            }
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
            cartTotal: totalAmount
        });

    } catch (error) {
        console.error('Error updating cart item:', error);
        res.status(500).json({ error: 'Failed to update cart item' });
    }
});

// Remove cart item
cart_items.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        // Get cart item with cart info
        const cartItem = await prisma.cart_item.findUnique({
            where: { id: Number(id) },
            include: {
                cart: true,
                product: {
                    select: {
                        product_name: true
                    }
                }
            }
        });

        if (!cartItem) {
            return res.status(404).json({ error: 'Cart item not found' });
        }

        // Check authorization
        if (cartItem.cart.user_id !== req.userId) {
            return res.status(403).json({ error: 'Unauthorized access' });
        }

        // Delete cart item
        await prisma.cart_item.delete({
            where: { id: Number(id) }
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

        res.json({
            message: `${cartItem.product.product_name} removed from cart successfully`,
            cartTotal: totalAmount,
            remainingItems: remainingItems.length
        });

    } catch (error) {
        console.error('Error removing cart item:', error);
        res.status(500).json({ error: 'Failed to remove cart item' });
    }
});

// Clear all cart items for user
cart_items.delete("/clear/all", authMiddleware, async (req, res) => {
    try {
        // Get all active carts for user
        const userCarts = await prisma.cart.findMany({
            where: {
                user_id: req.userId,
                status: 'active'
            }
        });

        if (userCarts.length === 0) {
            return res.status(404).json({ error: 'No active carts found' });
        }

        let totalItemsRemoved = 0;

        // Delete all cart items and update cart totals
        for (const cart of userCarts) {
            const cartItems = await prisma.cart_item.findMany({
                where: { cart_id: cart.id }
            });

            totalItemsRemoved += cartItems.length;

            await prisma.cart_item.deleteMany({
                where: { cart_id: cart.id }
            });

            await prisma.cart.update({
                where: { id: cart.id },
                data: { total_amount: 0 }
            });
        }

        res.json({
            message: 'All cart items cleared successfully',
            itemsRemoved: totalItemsRemoved,
            cartsCleared: userCarts.length
        });

    } catch (error) {
        console.error('Error clearing cart items:', error);
        res.status(500).json({ error: 'Failed to clear cart items' });
    }
});

// Clear cart items by cart ID
cart_items.delete("/clear/:cartId", authMiddleware, async (req, res) => {
    try {
        const { cartId } = req.params;

        // Verify cart exists and belongs to user
        const cart = await prisma.cart.findFirst({
            where: {
                id: Number(cartId),
                user_id: req.userId
            }
        });

        if (!cart) {
            return res.status(404).json({ error: 'Cart not found or unauthorized' });
        }

        // Count items before deletion
        const itemCount = await prisma.cart_item.count({
            where: { cart_id: Number(cartId) }
        });

        // Delete all items from specific cart
        await prisma.cart_item.deleteMany({
            where: { cart_id: Number(cartId) }
        });

        // Update cart total
        await prisma.cart.update({
            where: { id: Number(cartId) },
            data: { total_amount: 0 }
        });

        res.json({
            message: 'Cart cleared successfully',
            cartId: Number(cartId),
            itemsRemoved: itemCount
        });

    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({ error: 'Failed to clear cart' });
    }
});

// Get cart items count for user
cart_items.get("/count/total", authMiddleware, async (req, res) => {
    try {
        const totalItems = await prisma.cart_item.count({
            where: {
                cart: {
                    user_id: req.userId,
                    status: 'active'
                }
            }
        });

        const totalQuantity = await prisma.cart_item.aggregate({
            where: {
                cart: {
                    user_id: req.userId,
                    status: 'active'
                }
            },
            _sum: {
                quantity: true
            }
        });

        res.json({
            message: 'Cart count fetched successfully',
            totalUniqueItems: totalItems,
            totalQuantity: totalQuantity._sum.quantity || 0
        });

    } catch (error) {
        console.error('Error getting cart count:', error);
        res.status(500).json({ error: 'Failed to get cart count' });
    }
});

// Get cart items by product ID (check if product is in any cart)
cart_items.get("/product/:productId", authMiddleware, async (req, res) => {
    try {
        const { productId } = req.params;

        const cartItems = await prisma.cart_item.findMany({
            where: {
                product_id: Number(productId),
                cart: {
                    user_id: req.userId,
                    status: 'active'
                }
            },
            include: {
                cart: {
                    select: {
                        id: true,
                        store_id: true
                    }
                },
                product: {
                    select: {
                        product_name: true,
                        price: true
                    }
                }
            }
        });

        res.json({
            message: 'Product cart items fetched successfully',
            productId: Number(productId),
            cartItems,
            isInCart: cartItems.length > 0,
            totalQuantityInCarts: cartItems.reduce((sum, item) => sum + item.quantity, 0)
        });

    } catch (error) {
        console.error('Error fetching cart items by product:', error);
        res.status(500).json({ error: 'Failed to fetch cart items by product' });
    }
});

export default cart_items;
