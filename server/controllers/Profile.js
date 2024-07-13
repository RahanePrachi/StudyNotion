const Profile = require("../models/Profile");
const User = require("../models/User");
const { uploadImageCloudinary } = require("../utils/imageUploader");
// const { convertSecondsToDuration } = require("../utils/secToDuration");
const CourseProgress = require("../models/CourseProgress");
const Course = require("../models/Course");
//update profile
exports.updateProfile = async (req, res) => {
  try {
    //if user logged in to authentication wale middleware ke uper jo decode wala object nikdal tha wo request ke under add kiya tha ,means req ke under user id is already present

    //HW => HOW TO SCHEDULE THE REQUEST LIKE DELETE

    //get data
    const { dateOfBirth = "", about = "", contactNumber, gender } = req.body;

    //get user id
    const id = req.user.id;

    //validate data
    if (!contactNumber || !gender || !id) {
      return res.status(400).json({
        success: false,
        message: "all fields are required",
      });
    }
    //find profile
    const userDetails = await User.findById(id);
    const profileId = userDetails.additionalDetails; //user ke under profile ki id padi hai
    const profileDetails = await Profile.findById(profileId);

    //update profile
    profileDetails.dateOfBirth = dateOfBirth;
    profileDetails.about = about;
    profileDetails.gender = gender;
    profileDetails.contactNumber = contactNumber;

    await profileDetails.save();
    //return res
    return res.status(200).json({
      success: true,
      message: "profile updated successfully.",
      profileDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

//deleteaccount
exports.deleteAccount = async (req, res) => {
  try {
    //get id
    const id = req.user.id;
    console.log("Printing ID: ", req.user.id);

    //validation
    const userDetails = await User.findById(id);
    if (!userDetails) {
      return res.status(404).json({
        success: false,
        message: "user not found.",
      });
    }

    //delete profile
    await Profile.findByIdAndDelete({ _id: userDetails.additionalDetails });

    //  TODO HW=> enrolled user from all enrolled courses
    //HW=> how can we schedule this details => search cron job

    // const job = schedule.scheduleJob("10 * * * * *", function () {
    //   	console.log("The answer to life, the universe, and everything!");
    //   });
    //   console.log(job)

    //delete user
    await User.findByIdAndDelete({ _id: id });

    //return res
    return res.status(200).json({
      success: true,
      message: "user deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "user cannot be deleted successfully.",
    });
  }
};

//user all details
exports.getAllUserDetails = async (req, res) => {
  try {
    //get id
    const id = req.user.id;

    //validation

    //get user details
    const userDetails = await User.findById(id)
      .populate("additionalDetails")
      .exec();

    //return res
    return res.status(200).json({
      success: true,
      message: "user data fetched successfully.",
      data: userDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateDisplayPicture = async (req, res) => {
  try {
    const displayPicture = req.files.displayPicture;
    const userId = req.user.id;
    const image = await uploadImageCloudinary(
      displayPicture,
      process.env.FOLDER_NAME,
      1000,
      1000
    );
    console.log(image);
    const updatedProfile = await User.findByIdAndUpdate(
      { _id: userId },
      { image: image.secure_url },
      { new: true }
    );
    res.send({
      success: true,
      message: `Image Updated successfully`,
      data: updatedProfile,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    let userDetails = await User.findOne({
      _id: userId,
    })
      .populate({
        path: "courses",
        populate: {
          path: "courseContent",
          populate: {
            path: "subSection",
          },
        },
      })
      .exec();

    userDetails = userDetails.toObject();
    console.log("Printing userDetails: ", userDetails);
    var SubsectionLength = 0;

    for (var i = 0; i < userDetails.courses.length; i++) {
      let totalDurationInSeconds = 0;
      SubsectionLength = 0;
      for (var j = 0; j < userDetails.courses[i].courseContent.length; j++) {
        totalDurationInSeconds += userDetails.courses[i].courseContent[
          j
        ].subSection.reduce(
          (acc, curr) => acc + parseInt(curr.timeDuration),
          0
        );
        userDetails.courses[i].totalDuration = convertSecondsToDuration(
          totalDurationInSeconds
        );
        SubsectionLength +=
          userDetails.courses[i].courseContent[j].subSection.length;
      }
      let courseProgressCount = await CourseProgress.findOne({
        courseID: userDetails.courses[i]._id,
        userId: userId,
      });
      console.log("Printing userDetails after adding totalDuration field :", userDetails)
      courseProgressCount = courseProgressCount?.completedVideos.length;
      console.log("Printing courseProgressCount inside enrolledCourses: ", courseProgressCount);
      if (SubsectionLength === 0) {
        userDetails.courses[i].progressPercentage = 100;
      } else {
        // To make it up to 2 decimal point
        const multiplier = Math.pow(10, 2);
        userDetails.courses[i].progressPercentage =
          Math.round(
            (courseProgressCount / SubsectionLength) * 100 * multiplier
          ) / multiplier;
      }
    }

    if (!userDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find user with id: ${userDetails}`,
      });
    }
    return res.status(200).json({
      success: true,
      data: userDetails.courses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// exports.getEnrolledCourses = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     let userDetails = await User.findOne({
//       _id: userId,
//     })
//       .populate({
//         path: "courses",
//         populate: {
//           path: "courseContent",
//           populate: {
//             path: "subSection",
//           },
//         },
//       })
//       .exec();

//     userDetails = userDetails.toObject();
//     console.log("Printing userDetails: ", userDetails);
//     var SubsectionLength = 0;
//     for (var i = 0; i < userDetails.courses.length; i++) {
//       let totalDurationInSeconds = 0;
//       SubsectionLength = 0;
//       for (var j = 0; j < userDetails.courses[i].courseContent.length; j++) {
//         totalDurationInSeconds += userDetails.courses[i].courseContent[
//           j
//         ].subSection.reduce(
//           (acc, curr) => acc + parseInt(curr.timeDuration),
//           0
//         );
//         userDetails.courses[i].totalDuration = convertSecondsToDuration(
//           totalDurationInSeconds
//         );
//         SubsectionLength +=
//           userDetails.courses[i].courseContent[j].subSection.length;
//       }
//       console.log("Printing userDetails after adding totalDuration field :", userDetails)
//       let courseProgressCount = await CourseProgress.findOne({
//         courseID: userDetails.courses[i]._id,
//         userId: userId,
//       });
//       courseProgressCount = courseProgressCount?.completedVideos.length;
//       if (SubsectionLength === 0) {
//         userDetails.courses[i].progressPercentage = 100;
//       } else {
//         // To make it up to 2 decimal point
//         const multiplier = Math.pow(10, 2);
//         userDetails.courses[i].progressPercentage =
//           Math.round(
//             (courseProgressCount / SubsectionLength) * 100 * multiplier
//           ) / multiplier;
//       }
//     }

//     if (!userDetails) {
//       return res.status(400).json({
//         success: false,
//         message: `Could not find user with id: ${userDetails}`,
//       });
//     }
//     return res.status(200).json({
//       success: true,
//       data: userDetails.courses,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// exports.getEnrolledCourses = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     let userDetails = await User.findOne({
//       _id: userId,
//     })
//       .populate({
//         path: "courses",
//         populate: {
//           path: "courseContent",
//           populate: {
//             path: "subSection",
//           },
//         },
//       })
//       .exec();

//     userDetails = userDetails.toObject();
//     console.log("Printing userDetails: ", userDetails);
//     var SubsectionLength = 0;
//     for (var i = 0; i < userDetails.courses.length; i++) {
//       let totalDurationInSeconds = 0;
//       SubsectionLength = 0;
//       for (var j = 0; j < userDetails.courses[i].courseContent.length; j++) {
//         totalDurationInSeconds += userDetails.courses[i].courseContent[
//           j
//         ].subSection.reduce((acc, curr) => {
//           const duration = parseFloat(curr.timeDuration);
//           return acc + (isNaN(duration) ? 0 : duration);
//         }, 0);
//         userDetails.courses[i].totalDuration = convertSecondsToDuration(
//           totalDurationInSeconds
//         );
//         SubsectionLength +=
//           userDetails.courses[i].courseContent[j].subSection.length;
//       }
//       let courseProgressCount = await CourseProgress.findOne({
//         courseID: userDetails.courses[i]._id,
//         userId: userId,
//       });
//       courseProgressCount = courseProgressCount?.completedVideos.length || 0;
//       if (SubsectionLength === 0) {
//         userDetails.courses[i].progressPercentage = 100;
//       } else {
//         // To make it up to 2 decimal points
//         const multiplier = Math.pow(10, 2);
//         userDetails.courses[i].progressPercentage =
//           Math.round(
//             (courseProgressCount / SubsectionLength) * 100 * multiplier
//           ) / multiplier;
//       }
//     }

//     if (!userDetails) {
//       return res.status(400).json({
//         success: false,
//         message: `Could not find user with id: ${userDetails}`,
//       });
//     }
//     return res.status(200).json({
//       success: true,
//       data: userDetails.courses,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

function convertSecondsToDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}


exports.instructorDashboard= async (req, res)=>{
  try{
    const courseDetails=await Course.find({instructor:req.user.id});
    const courseData= courseDetails.map((course)=>{
      const totalStudentsEnrolled=course.studentsEnrolled.length;
      const totalAmountGenerated=totalStudentsEnrolled*course.price;

      //create an new object with additional fields
      const courseDataWithStats={
        _id:course._id,
        courseName:course.courseName,
        courseDescription:course.courseDescription,
        totalStudentsEnrolled,
        totalAmountGenerated,
      }
      return courseDataWithStats
    })
    res.status(200).json({
      courses:courseData,
    })
  }
  catch(error){
    console.error(error);
    res.status(500).json({
      message:"Internal server Error"
    })
  }
}