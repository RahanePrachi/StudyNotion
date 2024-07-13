const RatingAndReview= require("../models/RatingAndReview");
const Course=require("../models/Course");
const { mongoose } = require("mongoose");


//create rating

//createRating
exports.createRating = async (req, res) => {
    try{

        //get user id
        const userId = req.user.id;
        //fetchdata from req body
        const {rating, review, courseId} = req.body;
        //check if user is enrolled or not
        console.log("Printing courseId inside createRating :",courseId, "Printing userId : ", userId);
        const courseDetails = await Course.findOne({
            _id: courseId,
            studentsEnrolled: { $elemMatch: { $eq: userId } },
          })

        console.log("Printing course details inside createRating controller: ", courseDetails)

        if(!courseDetails) {
            return res.status(404).json({
                success:false,
                message:'Student is not enrolled in the course',
            });
        }
        //check if user already reviewed the course
        const alreadyReviewed = await RatingAndReview.findOne({
                                                user:userId,
                                                course:courseId,
                                            });
        if(alreadyReviewed) {
                    return res.status(403).json({
                        success:false,
                        message:'Course is already reviewed by the user',
                    });
                }
        //create rating and review
        const ratingReview = await RatingAndReview.create({
                                        rating, review, 
                                        course:courseId,
                                        user:userId,
                                    });
       
        //update course with this rating/review
        const updatedCourseDetails = await Course.findByIdAndUpdate({_id:courseId},
                                    {
                                        $push: {
                                            ratingAndReviews: ratingReview._id,
                                        }
                                    },
                                    {new: true});
        console.log(updatedCourseDetails);
        //return response
        return res.status(200).json({
            success:true,
            message:"Rating and Review created Successfully",
            ratingReview,
        })
    }
    catch(error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}



// exports.createRating= async (req, res)=>{
//     try{
//         //get user id
//         const userId= req.body.id; //thi+(kisko link kiya tha -> ekk payload tha jo hamane login karte samay attached kiya tha  hamare token ke sath, auth wale middleware me uuse token ko detached kiya aur waha se payload nikala us payload ko , req object ke sath link kar diya and waha se ham usako fetch kar pa rahe hai)

//         //fetch data from req body
//         const {rating, review, courseId}=req.body;

//         const courseDetails = await Course.findOne({ _id: courseId });
// console.log("Course details without user check:", courseDetails);

// const courseDetailsWithUser = await Course.findOne({
//     _id: courseId,
//     studentsEnrolled: { $elemMatch: { $eq: userId } },});

//         //check if user is enrolled or not
//         // const courseDetails = await Course.findOne(
//         //     {_id:courseId,
//         //     studentsEnrolled: {$elemMatch: {$eq: userId} },
//         // });

        

//         console.log("Printing student details in createRating controller: ", courseDetails);

//         if(!courseDetails){
//             return res.status(404).json({
//                 success:false,
//                 message:"student is not enrolled in the course",
//             })
//         }

//         //check if user alredy reviewed the course
//         const alreadyReviewed= await RatingAndReview.findOne({
//             user:userId,
//             course:courseId,
//         })

//         if(alreadyReviewed){
//             return res.status(403).json({
//                 success:false,
//                 message:"course is already review by the user",
//             })
//         }

//         //create rating and review
//         const ratingReview= await RatingAndReview.create({
//             rating, review, course:courseId, user:userId
//         });

//         //update course with this rating/review
//         const updatedCourseDetails=await Course.findByIdAndUpdate({_id:courseId},
//                                     {
//                                         $push:{
//                                             ratingAndReviews:ratingReview._id,
//                                         },
          
//                                     },{new:true})

//         console.log(updatedCourseDetails)
//         //return res

//         return res.status(200).json({
//             success:true,
//             message:"Rating and review successfully."
//         })

//     }
//     catch(error){
//         console.log(error);
//         return res.status(500).json({
//             success:false,
//             message:error.message
//         })
//     }
// }

//get average rating
exports.getAverageRating=async (req, res)=>{
    try{
        //get course id
        const courseId=req.body.courseId;

        //calc avg rating , search aggregate function in mongoose
        const result = await RatingAndReview.aggregate([
            {
                $match:{
                    course:new mongoose.Types.ObjectId(courseId), //courseId string thi use convert kar diya object id me
                },
            },
            {
                $group:{
                    _id:null,
                    averageRating:{$avg:"$rating"}
                }
            }
        ])
        //return rating
        if(result.length>0){
            return res.status(200).json({
                success:true,
                averageRating:result[0].averageRating,
            })
        }

        //if no rating review exist 
        return res.status(200).json({
            success:true,
            message:"average rating is zero , no rating given till now",
            averageRating:0,
        })
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }
}


//get all rating
exports.getAllRatingAndReview= async (req, res)=>{
    try{
        const allReviews= await RatingAndReview.find({}).sort({rating:"desc"})
                                                .populate({
                                                    path:"user",
                                                    select:"firstName lastName email image",
                                                })
                                                .populate({
                                                    path:"course",
                                                    select:"courseName",
                                                })
        
                                            .exec();
    return res.status(200).json({
        success:true,
        message:"All reviews fetched successfully.",
        data:allReviews,
    })
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }
}

//HW => course id  ke corresponding rating review laooo