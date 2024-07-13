const {instance}=require("../config/razorpay");
const Course=require("../models/Course");
const User=require("../models/User");
const mailSender=require("../utils/mailSender");
const crypto = require("crypto");
const {courseEnrollmentEmail}=require("../mail/templates/courseEnrollmentEmail");
const { default: mongoose } = require("mongoose");
const {paymentSuccessEmail}= require("../mail/templates/paymentSuccessEmail")
const CourseProgress = require("../models/CourseProgress");

//initiate the razorpay order
exports.capturePayment= async(req, res)=>{
    const {courses}=req.body;
    const userId=req.user.id;

    if(courses.length===0){
        return res.json({
            success:false,
            message:"Please provide course id"
        })
    }

    let totalAmount= 0;
    for(const course_id of courses){
        let course;
        try{
            course=await Course.findById(course_id);
            if(!course){
                return res.status(200).json({
                    success:false, 
                    message:"Could not find the course"
                })
            }

            const uid= new mongoose.Types.ObjectId(userId);
            if(course.studentsEnrolled.includes(uid)){
                return res.status(200).json({
                    success:false, 
                    message:"Student is already enrolled.",
                })
            }
            totalAmount+=course.price;

        }

        catch(error){
            console.log(error);
            return res.status(500).json({
                success:false, 
                message:error.message
            })
        }
    }

    const currency="INR";
    const options={
        amount:totalAmount *100,
        currency,
        receipt:Math.random(Date.now()).toString(),
    }

    try{
        const paymentResponse=await instance.orders.create(options);
        res.json({
            success:true,
            message:paymentResponse,
        })
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Could not initiate Order.",
        })
    }
}

//verify the payment
exports.verifyPayment = async(req, res) => {
    const razorpay_order_id = req.body?.razorpay_order_id;
    const razorpay_payment_id = req.body?.razorpay_payment_id;
    const razorpay_signature = req.body?.razorpay_signature;
    const courses = req.body?.courses;
    const userId = req.user.id;

    if(!razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature || !courses || !userId) {
            return res.status(200).json({success:false, message:"Payment Failed"});
    }

    let body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_SECRET)
        .update(body.toString())
        .digest("hex");

        if(expectedSignature === razorpay_signature) {
            //enroll karwao student ko
            await enrollStudents(courses, userId, res);
            //return res
            return res.status(200).json({success:true, message:"Payment Verified"});
        }
        return res.status(200).json({success:"false", message:"Payment Failed"});

}


const enrollStudents=async(courses, userId, res)=>{
    if(!courses || !userId){
        return res.status(400).json({
            success:false,
            message:"Please provide data for courses or userid"
        })

    }
    for(const courseId of courses){
        try{
            //find the course and enroll the student in it
            const enrolledCourse=await Course.findOneAndUpdate({_id:courseId},{$push:{studentsEnrolled:userId}},
                {new:true} //this is for , to give updated response.
            )

            if(!enrolledCourse){
                return res.status(500).json({success:false,
                    message:"Course not found."
                })
            }

            
        const courseProgress = await CourseProgress.create({
            courseID:courseId,
            userId:userId,
            completedVideos: [],
        })
        console.log("printing courseProgress after payment: ", courseProgress);

            //find the student and add the course to their list of enrolledCourses
            const enrolledStudent = await User.findByIdAndUpdate(userId, {$push:{courses:courseId}},
                {new:true},
            )

            //bachhe kko mail send kar do
            const emailResponse= await mailSender(enrollStudents.email,
                `Successfully Enrolled into ${enrolledCourse.courseName}`,
                courseEnrollmentEmail(enrolledCourse.courseName, `${enrolledStudent.firstName}`)
            )
            //console.log("Email Sent Successfully", emailResponse.response);
        }
        catch(error){
            console.log(error);
            return res.status(500).json({
                success:false,
                message:error.message,
            })
        }
    }
}

exports.sendPaymentSuccessEmail= async(req, res)=>{
    const {orderId, paymentId, amount }=req.body;
    const userId= req.user.id;
    if(!orderId|| !paymentId || !amount || !userId){
        return res.status(400).json({
            success:false, 
            message:"Please provide all the fields."
        })
    }

    try{
        //student ko dhundo
        const enrolledStudent= await User.findById(userId);
        await mailSender(enrolledStudent.email, `Payment Received`, paymentSuccessEmail(`${enrolledStudent.firstName}`, amount/100, orderId, paymentId))
    }
    catch(error){
        console.log("Error in sending mail", error);
        return res.status(500).json({
            success:false, 
            message:"Could not send email"
        })
    }
}

// //capture the payment and initiate the rozorpay order
// exports.capturePayment=async(req, res)=>{
//     //get courseid and user id
//     const {course_id}= req.body;
//     const userId= req.user.id;
//     //validation
//     //valid courseId
//     if(!course_id){
//         return res.json({
//             success:false,
//             message:"please provide valid course ID",
//         })
//     }
//     //valid courseDetails
//     let course;
//     try{
//         course=await Course.findById({course_id});

//         if(!course){
//             return res.json({
//                 success:false,
//                 message:"could not find the course",
//             });
//         }

//         //user already pay for the same course
//         //convert user id( present in string type ) into object id(present in object)
//         const uid= new mongoose.Types.ObjectId(userId);
//         if(course.studentEnrolled.includes(uid)){
//             return res.json({
//                 success:false,
//                 message:"Student is already enrolled."
//             });
//         }
//     }
//     catch(error){
//         console.error(error);
//         return res.stutus(500).json({
//             success:false,
//             message:error.message,
//         });
//     }

//     //create order
//     const amount=course.price;
//     const currency="INR";

//     const option={
//         amount:amount*100,
//         currency,
//         receipt:Math.random(Date.now()).toString(),
//         notes:{
//             courseId:course_id,
//             userId,
//         }
//     };

//     //function call
//     try{
//         //initiate the payment using razorpay
//         const paymentResponse=await instance.orders.create(option);
//         console.log(paymentResponse);
//         return res.status(200).json({
//             success:true,
//             courseName:course.courseName,
//             courseDescription:course.courseDescription,
//             thumbnail:course.thumbnail,
//             orderId:paymentResponse.id,
//             currency:paymentResponse.currency,
//             amount:paymentResponse.amount
//         })
//     }
//     catch(error){
//         console.log(error);
//         res.json({
//             success:false,
//             message:"Could not initiate order",
//         })
//     }
    
// }

// //verify signature for razorpay and server
// exports.verifySignature= async (req, res)=>{
//    const webhookSecret="12345678"

//    //see razorpay documentation->razorpay signature
//     const signature= req.headers["x-razorpay-signature"];

//     const shasum=crypto.createHmac("sha256", webhookSecret);
//     shasum.update(JSON.stringify(req.body));
//     const digest=shasum.digest("hex");
    
//     //matching
//     if(signature==digest){
//         console.log("payment is authorized.");

//         const {courseId, userId}= req.body.payload.payment.entity.notes;
        
//         try{
//             //fullfill the action
//             //find the course and enrolled the student in it
//             const enrolledCourse=await Course.findOneAndUpdate({_id:courseId},
//                                                     {$push:{studentEnrolled:userId}},
//                                                     {new:true});
        
//             if(!enrolledCourse){
//                 return res.status(500).json({
//                     success:false,
//                     message:"course not found"
//                 })
//             }
//             console.log(enrolledCourse);

//             //find the student and add the course to their list enrolled course me
//             const enrolledStudent = await User.findOneAndUpdate({_id:userId},
//                                         {$push:{cousers:courseId}},
//                                         {new:true},);
//             console.log(enrolledStudent);

//             //send confirmation mail to student => for that student data required => present in user model
//             //parameter inside mailSender(kisko bhejana hai, subject title, body(kya content bhejana chahate ho))
//             const emailResponse=await mailSender(
//                 enrolledStudent.email,
//                 "Congratulation from codehelp",
//                 "Congratulation, you are onboarded into new CodeHelp Course."

//             );
//             console.log(emailResponse);
//             return res.status(200).json({
//                 success:true,
//                 message:"Signature verified and course added",
//             })


//         }
//         catch(error){
//             console.log(error);
//             return res.status(500).json({
//                 success:false,
//                 message:error.message,
//             })

//         }
//     }

//     else{
//         return res.status(400).json({
//             success:false,
//             message:"Invalid request",
//         })
//     }

// };