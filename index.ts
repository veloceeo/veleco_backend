import express from "express"
import user from "./models/roles/user.js";
import store from "./models/store";
import product from "./models/products";
import order from "./models/orders";
import cartItemsRouter from './models/cart_items';
import sellerDashboard from "./models/seller_dashboard";
import sellerDashboardExtended from "./models/seller_dashboard_extended";
import paymentRoutes from './models/payment_routes.js';
import notification from "./models/notification_routes.js";
import settingsManagementRoutes from "./models/settings_management_routes.js";
import cartRoutes from "./models/cart";
import supportRoutes from './support_ticket_routes';
import seller from "./models/roles/seller.js";
import admin from "./models/roles/admin.js";
import sellerCap from "./models/seller_cap.js";
const app = express();

app.use(express.json());
app.use("/api/user", user);
app.use("/api/admin", admin); // Ensure this is before the store route
app.use("/store", store);
app.use("/product", product);
app.use("/cart",cartRoutes);
app.use("/order", order);
app.use("/api/seller",seller);
app.use('/cart-items', cartItemsRouter);
app.use("/dashboard", sellerDashboard);
app.use("/data",sellerDashboardExtended);
app.use('/api/payments', paymentRoutes); // Use the payment routes
app.use("/api/notifications", notification);
app.use("/api/settings",settingsManagementRoutes);
app.use('/api/support', supportRoutes);
app.use("/seller/seller_cap", sellerCap);
app.listen(3000, () => {
    console.log("server run at 3000");
})