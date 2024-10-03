const express =require("express");
const app=express();
const userRoutes= require("./routes/User")
const profileRoutes= require("./routes/Profile")
const paymentRoutes= require("./routes/Payments")
const courseRoutes= require("./routes/Course")

const contactUsRoute= require("./routes/Contact");

const database=require("./config/database");
const cookieParser=require("cookie-parser")
const cors=require("cors");
const {cloudinaryConnect}=require('./config/cloudinary');
const fileUpload=require('express-fileupload');
const dotenv= require("dotenv")
dotenv.config();

const PORT=process.env.PORT || 4000;
//db connect
database.connect();

//middleware
app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin:"http://localhost:3000",
        // origin:"https://studynotion-frontend-a4rj9adj3-prachi-rahanes-projects.vercel.app",
        credentials:true,
    })
)

app.use(
    fileUpload({
        useTempFiles:true,
        tempFileDir:"/tmp",
    })
)

//cloudinary connection
cloudinaryConnect();

//import route
app.use("/api/v1/auth", userRoutes)
app.use("/api/v1/profile", profileRoutes)
app.use("/api/v1/course", courseRoutes)
app.use("/api/v1/payment", paymentRoutes)
app.use("/api/v1/reach", contactUsRoute);

//default route
app.get("/", (req, res)=>{
    return res.json({
        success:true,
        message:"Your server is running ..."
    })
})

app.listen(PORT , ()=>{
    console.log(`app is running at ${PORT}`);
})