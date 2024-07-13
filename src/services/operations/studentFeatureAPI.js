import toast from "react-hot-toast";
import { studentEndpoints } from "../apis";
import { apiConnector } from "../apiconnector";
import { setPaymentLoading } from "../../slices/courseSlice";
import { resetCart } from "../../slices/cartSlice";
import rzpLogo from "../../assets/Logo/rzp_logo.png"
const {COURSE_PAYMENT_API, COURSE_VERIFY_API, SEND_PAYMENT_SUCCESS_EMAIL_API}=studentEndpoints ;

//load your script at runtime
function loadScript(src){
    return new Promise((resolve)=>{
        const script = document.createElement("script");
        script.src=src;

        script.onload=()=>{
            resolve(true);
        }
        script.onerror=()=>{
            resolve(false);
        }
        document.body.append(script);
    })
}

export async function buyCourse(token, courses, userDetails, navigate, dispatch){
    const toastId=toast.loading("Loading...");
    console.log("Printing userDetails inside buyCourses :", userDetails);
    try{
        //load the script
        const res= await loadScript("https://checkout.razorpay.com/v1/checkout.js");

        if(!res){
            toast.error("Razorpay SDK failded to laod.");
            return;
        }

        //initiate the order
        const orderResponse= await apiConnector("POST", COURSE_PAYMENT_API, {courses},{Authorization:`Bearer ${token}`})

        if(!orderResponse.data.success){
            throw new Error(orderResponse.data.message);
        }
        console.log("Printing orderResponse", orderResponse);

        //options
        const options={
            key:process.env.RAZORPAY_KEY,
            currency:orderResponse.data.message.currency,
            amount:`${orderResponse.data.message.amount}`,
            order_id:orderResponse.data.message.id,
            name:"StudyNotion",
            description:"Thank You for Purchasing the Course",
            image:rzpLogo,
            prefill:{
                name:`${userDetails.firstName}`,
                email:userDetails.email
            },
            handler:function(response){
                //send successful wal mail
                sendPaymentSuccessEmail(response, orderResponse.data.message.amount, token);

                //verifyPayment
                verifyPayment({...response, courses}, token , navigate, dispatch);
            }

        }

        //miss hogya tha
        const paymentObject= new window.Razorpay(options);
        paymentObject.open();
        paymentObject.on("payment.failed", function(response){
            toast.error("oosps, payment failed");
            console.log(response.error);
        })
    }
    catch(error){
        console.log("PAYMENT API ERROR...", error);
        toast.error("Could not make payment.");
    }
    toast.dismiss(toastId);
}

async function sendPaymentSuccessEmail(response, amount, token){
    try{
        await apiConnector("POST", SEND_PAYMENT_SUCCESS_EMAIL_API, {
            orderId:response.razorpay_order_id,
            paymentId:response.razorpay_payment_id,
            amount,
        }, {
            Authorization:`Bearer ${token}`
        })
    }
    catch(error){
        console.log("Payment success email error...", error);
    }
}

//verify payment
async function verifyPayment(bodyData, token, navigate, dispatch){
    const toastId= toast.loading("Verfying Payment...");
   
    dispatch(setPaymentLoading(true));
    try{
        const response= await apiConnector("POST", COURSE_VERIFY_API, bodyData, {
            Authorization:`Bearer ${token}`,
        })
        console.log("Printing response of verify payment call: ", response);

        if(!response.data.success){
            throw new Error(response.data.message);
        }
        toast.success("payment successful, you are added to the course");
        navigate("/dashboard/enrolled-courses");
        dispatch(resetCart());
    }

    catch(error){
        console.log("PAYMENT VERIFY ERROR.... ", error);
        toast.error("Could not verify Payment.");
    }
    toast.dismiss(toastId);
    dispatch(setPaymentLoading(false));
}