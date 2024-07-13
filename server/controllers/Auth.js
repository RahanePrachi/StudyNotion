const User = require("../models/User");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const mailSender = require("../utils/mailSender");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");
const Profile = require("../models/Profile");

require("dotenv").config();

//sending otp
// exports.sendOTP = async (req, res) => {
//   try {
//     //fetch email form request ki body
//     const { email } = req.body;

//     //check if user is already exit
//     const checkUserPresent = await User.findOne({ email });

//     //fetch if user is already exit then return a response
//     if (checkUserPresent) {
//       return res.status(401).json({
//         success: false,
//         message: "User already registered.",
//       });
//     }

//     //line form 33-47 bahut bad code -> db call ke uper loop not happen in industry
//     //in industry => they provide a valid and unique otp each time.
//     //this is brute force this is not happen in industry that db ke uper bar bar call karna ,

//     //generate otp
//     var otp = otpGenerator.generate(6, {
//       upperCaseAlphabets: false,
//       lowerCaseAlphabets: false,
//       specialChars: false,
//     });
//     console.log("OTP generated: ", otp);

//     //check otp is unique or not => generate otp till we not get unique one
//     let result = await OTP.findOne({ otp: otp });

//     //if not generating new otp=>
//     while (result) {
//       otp = otpGenerator(6, {
//         upperCaseAlphabets: false,
//         lowerCaseAlphabets: false,
//         specialChars: false,
//       });
//       result = await OTP.findOne({ otp: otp });
//     }

//     //otp entry in db
//     const otpPayload = { email, otp };
//     const otpBody = await OTP.create(otpPayload);
//     console.log(otpBody);

//     //return response successfully
//     res.status(200).json({
//       success: true,
//       message: "OTP send successfully.",
//       otp
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

exports.sendotp = async (req, res) => {
	try {
		const { email } = req.body;

		// Check if user is already present
		// Find user with provided email
		const checkUserPresent = await User.findOne({ email });
		// to be used in case of signup

		// If user found with provided email
		if (checkUserPresent) {
			// Return 401 Unauthorized status code with error message
			return res.status(401).json({
				success: false,
				message: `User is Already Registered`,
			});
		}

		var otp = otpGenerator.generate(6, {
			upperCaseAlphabets: false,
			lowerCaseAlphabets: false,
			specialChars: false,
		});
		const result = await OTP.findOne({ otp: otp });
		console.log("Result is Generate OTP Func");
		console.log("OTP", otp);
		console.log("Result", result);
		while (result) {
			otp = otpGenerator.generate(6, {
				upperCaseAlphabets: false,
			});
		}
		const otpPayload = { email, otp };
		const otpBody = await OTP.create(otpPayload);
		console.log("OTP Body", otpBody);
		res.status(200).json({
			success: true,
			message: `OTP Sent Successfully`,
			otp,
		});
	} catch (error) {
		console.log(error.message);
		return res.status(500).json({ success: false, error: error.message });
	}
};

// sign up


exports.signUp = async (req, res) => {
  try {
    //data fetch from req.body
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      accountType,
      contactNumber,
      otp,
    } = req.body;

    //validate data
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !otp
    ) {
      return res.status(403).json({
        success: false,
        message: "all fields are required.",
      });
    }

    //2 password match karo ->confirm pwd
    if (password != confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "password and confirmPassword value does not match , please try again.",
      });
    }

    //check user already exit or not
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "user is already registered.",
      });
    }

    //find most recent otp stored for user
    const recentOtp = await OTP.find({ email })
      .sort({ createdAt: -1 })
      .limit(1);
    console.log("recent otp :", recentOtp);

    //validate otp
    if (recentOtp.length == 0) {
      //means otp nahi mila
      return res.status(400).json({
        success: false,
        message: "OTP not found.",
      });
    } else if (otp != recentOtp[0].otp) {
      //invalid otp
      return res.status(400).json({
        success: false,
        message: "The OTP is not valid",
      });
    }

    //hash password ->bcrypt package required
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
		let approved = "";
		approved === "Instructor" ? (approved = false) : (approved = true);

    //entry created in db
    const profileDetails = await Profile.create({
      gender: null,
      dateOfBirth: null,
      about: null,
      contactNumber: null,
    });

    const user = await User.create({
      firstName,
      lastName,
      email,
      contactNumber,
      password: hashedPassword,
      accountType,
      additionalDetails: profileDetails._id,
      image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
    });

    //return response
    return res.status(200).json({
      success: true,
      message: "user is registered successfully",
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "user cannot be registered, Please try again.",
    });
  }
};

//login
exports.login = async (req, res) => {
  try {
    //get data from req body
    const { email, password } = req.body;

    //validation data
    if (!email || !password) {
      return res.status(403).json({
        success: false,
        message: "All fields are required , Please try again.",
      });
    }
    //user check exist or not
    const user = await User.findOne({ email }).populate("additionalDetails");

    // If user not found with provided email
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "user is not registered , please sign up first",
      });
    }
    //generate jwt(json web token- it is a secured way to transmit the information.) , after password matching
    if (await bcrypt.compare(password, user.password)) {
      const payload = {
        email: user.email,
        id: user._id,
        accountType: user.accountType,
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "24h",
      });

      user.token = token;
      user.password = undefined;

      //create cookie and send response`
      const options = {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), //3day valid
        httpOnly: true,
      };

      res.cookie("token", token, options).status(200).json({
        success: true,
        token,
        user,
        message: "logged in successfully.",
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Password is incorrect.",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "login failure, please try again.",
    });
  }
};

// Controller for Changing Password
exports.changePassword = async (req, res) => {
	try {
		// Get user data from req.user
		const userDetails = await User.findById(req.user.id);

		// Get old password, new password, and confirm new password from req.body
		const { oldPassword, newPassword, confirmNewPassword } = req.body;

		// Validate old password
		const isPasswordMatch = await bcrypt.compare(
			oldPassword,
			userDetails.password
		);
		if (!isPasswordMatch) {
			// If old password does not match, return a 401 (Unauthorized) error
			return res
				.status(401)
				.json({ success: false, message: "The password is incorrect" });
		}

		// Match new password and confirm new password
		if (newPassword !== confirmNewPassword) {
			// If new password and confirm new password do not match, return a 400 (Bad Request) error
			return res.status(400).json({
				success: false,
				message: "The password and confirm password does not match",
			});
		}

		// Update password
		const encryptedPassword = await bcrypt.hash(newPassword, 10);
		const updatedUserDetails = await User.findByIdAndUpdate(
			req.user.id,
			{ password: encryptedPassword },
			{ new: true }
		);

		// Send notification email
		try {
			const emailResponse = await mailSender(
				updatedUserDetails.email,
				passwordUpdated(
					updatedUserDetails.email,
					`Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
				)
			);
			console.log("Email sent successfully:", emailResponse.response);
		} catch (error) {
			// If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
			console.error("Error occurred while sending email:", error);
			return res.status(500).json({
				success: false,
				message: "Error occurred while sending email",
				error: error.message,
			});
		}

		// Return success response
		return res
			.status(200)
			.json({ success: true, message: "Password updated successfully" });
	} catch (error) {
		// If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
		console.error("Error occurred while updating password:", error);
		return res.status(500).json({
			success: false,
			message: "Error occurred while updating password",
			error: error.message,
		});
	}
};
