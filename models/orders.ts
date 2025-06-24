import express from "express";
import { PrismaClient } from "../db/generated/prisma";
import { authAdminMiddleware, authMiddleware } from "./auth/middleware";
const order = express.Router();
order.use(express.json());

const prisma = new PrismaClient();


// order.get("/", async (req, res) => {
//     const data = await prisma.orders.findMany();
//     res.send(data);
// })


// ... existing code ...

order.get("/",authMiddleware, async (req, res) => {
    try{
        const data = await prisma.orders.findMany();
        if (!data || data.length === 0) {
             res.status(404).json({ error: "No orders found" });
        }
      res.send(data);
    }
    catch(e){
        res.status(500).json({ error: "Failed to fetch orders", details: e });
    }
   
});

// Create a new order
order.post("/order",authMiddleware ,async (req, res) => {
    try {
        const orderData = req.body;
        const newOrder = await prisma.orders.create({
            
            data: orderData,
            
        });
        res.status(200).json(newOrder);
    } catch (error) {
        res.status(400).json({ error: "Failed to create order", details: error });
    }
});

// Get a specific order by ID
order.get("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const order = await prisma.orders.findUnique({
            where: { id: Number(id) },
        });
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }
        res.json(order);
    } catch (error) {
        res.status(400).json({ error: "Failed to fetch order", details: error });
    }
});

// Update an order by ID
order.put("/:id", async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    try {
        const updatedOrder = await prisma.orders.update({
            where: { id: Number(id) },
            data: updateData,
        });
        res.json(updatedOrder);
    } catch (error) {
        res.status(400).json({ error: "Failed to update order", details: error });
    }
});

// Delete an order by ID
order.delete("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.orders.delete({
            where: { id: Number(id) },
        });
        res.json({ message: "Order deleted successfully" });
    } catch (error) {
        res.status(400).json({ error: "Failed to delete order", details: error });
    }
});

// Admin route to get all orders

order.post("/admin", authAdminMiddleware, async (req, res) => {
    try {
        const orderCheck = await prisma.orders.findMany();
        if (!orderCheck || orderCheck.length === 0) {
            return res.status(404).json({ error: "No orders found" });
        }
        res.json(orderCheck);

    }
catch (error) {
        res.status(500).json({ error: "Failed to Accept ", details: error
        });
    }

})


order.get("/admin", authAdminMiddleware, async (req, res) => {
    try {
        const orders = await prisma.orders.findMany();
        if (!orders || orders.length === 0) {
            return res.status(404).json({ error: "No orders found" });
        }
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch orders", details: error });
    }
});

order.post("/admin/order", authMiddleware, async (req, res) => {
    try {
        const orderData = req.body;
        const newOrder = await prisma.orders.create({
            data: orderData,
        });
        res.status(201).json(newOrder);
    } catch (error) {
        res.status(400).json({ error: "Failed to create order", details: error
        });
    }   
});

export default order;