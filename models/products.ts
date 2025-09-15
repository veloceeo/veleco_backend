import express from "express";
import cloudinary, { UploadStream } from "cloudinary";
import { PrismaClient } from "../db/generated/prisma";
import { authMiddleware } from "../models/auth/middleware";
import multer from "multer";

const product = express.Router();
const prisma = new PrismaClient()

product.get("/",authMiddleware, async (req, res) => {
    const product = await prisma.product.findMany();
    if (!product || product.length === 0) {
         res.status(404).json({ error: "No products found" });
         return;
    }
    res.send(product);
})
//add product

product.post("/add", authMiddleware, async (req, res) => {
    try {
        const { product_name, price, product_img, quantity, category, stock } = req.body;

        // First, find the store for the authenticated user
        const userStore = await prisma.store.findFirst({
            where: {
                user_id: req.userId
            },
            select: {
                id: true
            }
        });

        if (!userStore) {
            res.status(404).json({ error: "Store not found for this user" });
            return;
        }

        const products = await prisma.product.create({
            data: {
                product_name,
                price: parseInt(price),
                product_img: Array.isArray(product_img) ? product_img : [product_img],
                quantity: parseInt(quantity),
                category,
                stock: parseInt(stock),
                store_id: userStore.id,
                latitude: 0.0
            }
        })

        res.json({ message: "Product created successfully", product: products });
    } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({ error: "Failed to create product" });
    }
})


//product search and stock 
product.post("/quantity/:name",  authMiddleware ,async (req, res) => {
    try {
        const { name } = req.params;
        const product = await prisma.product.findFirst({
            where: {
                product_name: name
            },
            select: {
                quantity: true,
                product_name: true,
                stock: true
            }
        });

        if (!product) {
            res.status(404).json({ error: "Product not found" });
            return;
        }

        if (product.stock > 0) {
            res.json({ product_name: product.product_name, quantity: product.quantity, stock: product.stock });
            return;
        }
        else {
            res.send("low stock")
        }
        // res.json({ product_name: product.product_name, quantity: product.quantity,stock:product.stock });
    } catch (error) {
        console.error("Error fetching product quantity:", error);
        res.status(500).json({ error: "Failed to fetch product quantity" });
    }
})


product.get("/search/:name", async (req, res) => {
    try{
        const {name}= req.params;
        const product = await prisma.product.findFirst({
            where:{
                product_name: {
                    contains: name,
                    mode: 'insensitive' // Case-insensitive search
                }
            }
        })
        if (!product) {
            res.status(404).json({ error: "Product not found" });
            return;
        }
        res.json(product);
    }
    catch (error) {
        console.error("Error searching product:", error);
        res.status(500).json({ error: "Failed to search product" });
    }
})

product.delete("/:name", authMiddleware, async (req, res) => {
    try {
        const {name} = req.params as { name: string };
        if(!name) {
            res.status(400).json({ error: "Product name is required" });
            
        }
        const productExists = await prisma.product.findFirst({
            where: {
                product_name: name
            }
        });
        const deletedProduct = await prisma.product.delete({
            where: {
                id: productExists?.id,
                product_name: productExists?.product_name
                
            }
        });
        if (!deletedProduct) {
            res.status(404).json({ error: "Product not found" });
            return;
        }
            res.json({ message: "Product deleted successfully",name: productExists?.product_name });

    }
    catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ error: "Failed to delete product" });
    }

})


export default product;