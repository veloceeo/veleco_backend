import express from "express"
import user from "./models/user";
const app = express();


app.use(express.json());
app.use("/user",user);
app.listen(3000,()=>{
    console.log("server run at 3000");
})