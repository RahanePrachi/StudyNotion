const nodemailer=require("nodemailer");

const mailSender= async (email, title, body)=>{
    try{
        let transporter= nodemailer.createTransport({
            host:process.env.MAIL_HOST,
            // service:"email",
            auth:{
                user:process.env.MAIL_USER,
                pass:process.env.MAIL_PASS,
            },
            // secure: true, // Use SSL/TLS
            // port: 465,    // Port for SSL
        });
        console.log(transporter);
        let  info=await transporter.sendMail({
            from:'StudyNotion || CodeHelp- by Babbar',
            // from:process.env.MAIL_HOST,
            to:`${email}`,
            subject:`${title}`,
            html:`${body}`,
        })
        console.log(info);
        return info;
    }
    catch(error){
        console.log(error.message);
    }
}

module.exports=mailSender;