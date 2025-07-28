import express from "express"
import {authSellerMiddleware} from "./auth/middleware"
import { PrismaClient } from "../db/generated/prisma";
import e from "express";
const prisma = new PrismaClient();
const  route = express.Router();

 const models = [{
  "SubscriptionPlans": [
    {
      "DailyOrders": "1-5",
      "Tier": "Starter",
      "SubscriptionPlanPerQuarter": {
        "Min": 3000,
        "Max": 5000
      }
    },
    {
      "DailyOrders": "6-20",
      "Tier": "Growth",
      "SubscriptionPlanPerQuarter": {
        "Min": 6000,
        "Max": 12000
      }
    },
    {
      "DailyOrders": "21+",
      "Tier": "Premium (Pro)",
      "SubscriptionPlanPerQuarter": {
        "Min": 15000,
        "Max": 30000
      }
    }
  ]
}
]

route.get("/",async (req,res)=>{
   res.json({
      "models": models
   })
})

route.get("/get-seller-cap", async (req, res) => {
    try {
        const sellerCaps = await prisma.seller_caps.findMany();
        res.json(sellerCaps);
    } catch (error) {
        console.error("Error fetching seller caps:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

route.post("/create-seller-cap",authSellerMiddleware, async (req, res) => {
    try {
             const sellerId = req.userId;
             console.log("Seller ID:", sellerId);
        if (!sellerId) {
             res.status(400).json({ error: "Seller ID is required" });
        }
        const { daily_order, subscription_type, tier } = req.body;
        if (!daily_order || !subscription_type || !tier) {
             res.status(400).json({ error: "Missing required fields" });
        }

        const newCap = await prisma.seller_caps.create({
            data: {
                seller_id: sellerId,
                daily_order,
                subscription_type,
                tier
            }
        });

        res.status(201).json(newCap);
    } catch (error) {
        console.error("Error creating seller cap:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

route.put("/update-seller-cap/:id", authSellerMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { daily_order, subscription_type, tier } = req.body;

        const updatedCap = await prisma.seller_caps.update({
            where: { id: parseInt(id as string) },
            data: {
                daily_order,
                subscription_type,
                tier
            }
        });

        res.json(updatedCap);
    } catch (error) {
        console.error("Error updating seller cap:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

route.delete("/delete-seller-cap/:id", authSellerMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.seller_caps.delete({
            where: { id: parseInt(id as string) }
        });

        res.status(204).send();
    } catch (error) {
        console.error("Error deleting seller cap:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

const sellerCap = route;
export default sellerCap;