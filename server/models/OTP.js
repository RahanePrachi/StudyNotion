const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");
const emailTemplate = require("../mail/templates/emailVerificationTemplate");
const OTPSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    expires: 5 * 60, //5 min
  },
});

//function -> to send email
async function sendVerificationEmail(email, otp) {
  try {
    // Create a transporter to send emails
	// Define the email options
    // Send the email
    console.log(email);
    console.log(otp);
    const mailResponse = await mailSender(
      email,
      "Verification Email form StudyNotion ",
      otp
    );
    console.log("Email sent successfully: ", mailResponse);
  } catch (error) {
    console.log("Error occured while sending email: ", error);
    throw error;
  }
}

//using pre middleware
OTPSchema.pre("save", async function (next) {
  console.log("New document saved to database");

	// Only send an email when a new document is created
	if (this.isNew) {
		await sendVerificationEmail(this.email, this.otp);
	}
	next();
});

module.exports = mongoose.model("OTP", OTPSchema);
