import express from "express"
import user from "./models/user";
import store from "./models/store";
import product from "./models/products";
import order from "./models/orders";
import router from "./models/cart";
import cartItemsRouter from './models/cart_items';
import sellerDashboard from "./models/seller_dashboard";
import sellerDashboardExtended from "./models/seller_dashboard_extended";

const app = express();

app.use(express.json());
app.use("/user", user);
app.use("/store", store);
app.use("/product", product);
app.use("/cart",router);
app.use("/order", order);
app.use('/cart-items', cartItemsRouter);
app.use("/dashboard", sellerDashboard);
app.use("/data",sellerDashboardExtended);

app.listen(3000, () => {
    console.log("server run at 3000");
})