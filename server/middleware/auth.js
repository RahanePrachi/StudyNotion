const jwt=require("jsonwebtoken");
require("dotenv").config();
const User=require("../models/User");

//auth
exports.auth= async (req, res, next)=>{
    try{
        //extract token
        const token=req.cookies.token || req.body.token || req.header("Authorization").replace("Bearer ", ""); //Bearer ke baad space dena is imp

        console.log("printing token at backend auth middleware: ", token);
        //if token missing 
        if(!token){
            return  res.status(401).json({
                success:false,
                message:'Token is missing.',
            });
        }
        //verify the token -> based on secret key
        try{
            const decode= jwt.verify(token, process.env.JWT_SECRET);
            console.log(decode);
            req.user= decode;   //adding user to requrest (decode ke payload me id pass ki hui hai{auth.js controller => login controller ke under})

        }catch(error){
            //verification issue
            return res.status(401).json({
                success:false,
                message:'token is invalid.',
            })
        }
        next();  //go to next middleware.

    }catch(error){
            return res.status(401).json({
                success:false,
                message:'something went wrong while validating the token.',
            })
    }
}

//isStudent
exports.isStudent= async(req, res, next)=>{
    try{
        if(req.user.accountType != "Student"){
            return res.status(401).json({
                success:false,
                message:'this is protected route for student only.'
            });
        }
        next();

    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:'user role cannot be verified, please try again.',
        })
    }
}

//isInstructor
exports.isInstructor= async(req, res, next)=>{
    try{
        if(req.user.accountType != "Instructor"){
            return res.status(401).json({
                success:false,
                message:'this is protected route for Instructor only.'
            });
        }
        next();

    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:'user role cannot be verified, please try again.',
        })
    }
}


//isAdmin
exports.isAdmin= async(req, res, next)=>{
    try{
        if(req.user.accountType != "Admin"){
            return res.status(401).json({
                success:false,
                message:'this is protected route for Admin only.'
            });
        }
        next();

    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:'user role cannot be verified, please try again.',
        })
    }
}
