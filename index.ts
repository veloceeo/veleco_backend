import express from "express"
import user from "./models/user";
import store from "./models/store";
const app = express();


app.use(express.json());
app.use("/user", user);
app.use("/store", store);
app.listen(3000, () => {
    console.log("server run at 3000");
})