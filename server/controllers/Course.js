// const { isInstructor } = require("../middleware/auth");
const Course = require("../models/Course");
const Category = require("../models/Category");
const User = require("../models/User");
const { uploadImageCloudinary } = require("../utils/imageUploader");
const Section = require("../models/Section")
const  CourseProgress= require("../models/CourseProgress");
// const {convertSecondsToDuration}= require("../utils/secToDuration")
const SubSection = require("../models/SubSection");

//createCOurce handler function
exports.createCourse = async (req, res) => {
  try {
    const userId = req.user.id;
    //fetch data
   let { courseName, courseDescription, whatYouWillLearn, price, tag,category ,	status,
			instructions} =
      req.body;
    //get thumbnail
    const thumbnail = req.files.thumbnailImage;
    // console.log(courseName, courseDescription, whatYouWillLearn, price, tag,category ,	status,
		// 	instructions)
    //validation
    if (
      !courseName ||
      !courseDescription ||
      !whatYouWillLearn ||
      !price ||
      !tag ||
      !thumbnail ||
      !category
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!status || status === undefined) {
			status = "Draft";
		}
    //check for instructor here we need instructor object id 
    // const userId = req.user.id;   //this is instructor user id
    const instructorDetails = await User.findById(userId,{
			accountType: "Instructor",
		});
   
    //for here we get instructor object id
    // console.log("Instructor Details : ", instructorDetails);

    //HW- todo: verify that userId and instructorDetails._id are same or different

    if (!instructorDetails) {
      return res.status(404).json({
        success: false,
        message: "Instructor details not found.",
      });
    }

    //check given tag is valid or not
    const categoryDetails = await Category.findById(category);
    // console.log("Category details : ", categoryDetails)
		if (!categoryDetails) {
			return res.status(404).json({
				success: false,
				message: "Category Details Not Found",
			});
		}

    //upload image to cloudinary
    const thumbnailImage = await uploadImageCloudinary(
      thumbnail,
      process.env.FOLDER_NAME
    );

    // console.log(thumbnailImage);
    //create an entry for new cource
    const newCourse = await Course.create({
      courseName,
      courseDescription,
      instructor: instructorDetails._id,
      whatYouWillLearn: whatYouWillLearn,
      price,
      tag: tag,
			category: categoryDetails._id,
			thumbnail: thumbnailImage.secure_url,
			status: status,
			instructions: instructions,
      
    });

    //add the new course to the user schema of instructor
    await User.findByIdAndUpdate(
			{
				_id: instructorDetails._id,
			},
			{
				$push: {
					courses: newCourse._id,
				},
			},
			{ new: true }
		);

    //update the tag schema-HW

    const categoryDetails2 = await Category.findByIdAndUpdate(
			{ _id: category },
			{
				$push: {
					courses: newCourse._id,
				},
			},
			{ new: true }
		);
    console.log("HEREEEEEEEE", categoryDetails2)
    //retrun response
    return res.status(200).json({
      success: true,
      message: "Course created successfully.",
      data: newCourse,
    });
  } catch (error) {
    // Handle any errors that occur during the creation of the course
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to creat course",
      error: error.message,
    });
  }
};

//Edit course details
exports.editCourse=async (req, res)=>{
  try{
    const {courseId}= req.body;
    console.log("printing course id inside edit call :", courseId);
    const updates= req.body;
    const course= await Course.findById(courseId);

    if(!course){
      return res.status(404).json({error:"Course not found"});
    }
    //If thumbnail image is found , update it 
    if(req.files){
      console.log("thumbnail update");
      const thumbnail=req.files.thumbnailImage;
      const thumbnailImage=await uploadImageCloudinary(thumbnail. process.env.FOLDER_NAME);
      course.thumbnail=thumbnailImage.secure_url;
    }

    //update only the fields that are present in the request body
    for(const key in updates){
      if(updates.hasOwnProperty(key)){
        if(key ==="tag" || key==="insturctions"){
          course[key]=JSON.parse(updates[key])
        }
        else{
          course[key]=updates[key];
        }
      }
    }

    await course.save();
    const updatedCourse=await Course.findOne({
      _id:courseId
    }).populate({
      path:"instructor",
      populate:{path:"additionalDetails"},
    })
    .populate("category")
    // .populate("ratiingAndReviews")
    .populate({
      path:"courseContent",
      populate:{
        path:"subSection",
      }
    })
    .exec();

    res.json({
      success:true,
      message:"Course updated successfully",
      data:updatedCourse,
    })


  }
  catch(error){
      console.log(error);
      res.status(500).json({
        success:false,
        message:"Internal server error",
        error:error.message,
      })
  }
}

exports.getAllCourses= async (req, res)=>{
  try{
    const allCourses=await Course.find({
      status:"Published"
    },
  {
    courseName:true,
    price:true,
    thumbnail:true,
    ratingAndReviews:true,
    studentEnrolled:true,
  })
  .populate("instructor").exec()
  return res.status(200).json({
    success:true,
    data:allCourses,
  })

  }catch(error){
    console.log(error);
    return res.status(404).json({
      success:false,
      message:`Can't fetch course data`,
      error:message.error,
    })
  }
}



//getAll courses handler function
exports.showAllCourses = async (req, res) => {
  try {
    //TODO: change the below statement incrementally.
    // const allCourses = await Course.find({});
    
    const allCourses = await Course.find(
        {},
        {
          courseName: true,
          price: true,
          thumbnail: true,
          instructor: true,
          ratingAndReviews: true,
          studentsEnrolled: true,
        }
      ).populate("instrutor")
      .exec();


    //return res
    return res.status(200).json({
        success:true,
        message:"Data for all courses fetched successfully.",
        data: allCourses,
    })



  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "cannot fetch course data",
      error: error.message,
    });
  }
};

function convertSecondsToDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
} 
//get course details
exports.getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.body
    const courseDetails = await Course.findOne({
      _id: courseId,
    })
      .populate({
        path: "instructor",
        populate: {
          path: "additionalDetails",
        },
      })
      .populate("category")
      .populate("ratingAndReviews")
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
          select: "-videoUrl",
        },
      })
      .exec()

    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find course with id: ${courseId}`,
      })
    }

    // if (courseDetails.status === "Draft") {
    //   return res.status(403).json({
    //     success: false,
    //     message: `Accessing a draft course is forbidden`,
    //   });
    // }

    let totalDurationInSeconds = 0
    courseDetails.courseContent.forEach((content) => {
      content.subSection.forEach((subSection) => {
        const timeDurationInSeconds = parseInt(subSection.timeDuration)
        totalDurationInSeconds += timeDurationInSeconds
      })
    })

    const totalDuration = convertSecondsToDuration(totalDurationInSeconds)
    console.log("Printing totalDuration: ", totalDuration);
    return res.status(200).json({
      success: true,
      data: {
        courseDetails,
        totalDuration,
      },
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

exports.getFullCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.body
    const userId = req.user.id
    const courseDetails = await Course.findOne({
      _id: courseId,
    })
      .populate({
        path: "instructor",
        populate: {
          path: "additionalDetails",
        },
      })
      .populate("category")
      .populate("ratingAndReviews")
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })
      .exec()

    let courseProgressCount = await CourseProgress.findOne({
      courseID: courseId,
      userId: userId,
    })

    console.log("courseProgressCount : ", courseProgressCount)

    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find course with id: ${courseId}`,
      })
    }

    // if (courseDetails.status === "Draft") {
    //   return res.status(403).json({
    //     success: false,
    //     message: `Accessing a draft course is forbidden`,
    //   });
    // }

    let totalDurationInSeconds = 0
    courseDetails.courseContent.forEach((content) => {
      content.subSection.forEach((subSection) => {
        const timeDurationInSeconds = parseInt(subSection.timeDuration)
        totalDurationInSeconds += timeDurationInSeconds
      })
    })

    const totalDuration = convertSecondsToDuration(totalDurationInSeconds)

    return res.status(200).json({
      success: true,
      data: {
        courseDetails,
        totalDuration,
        completedVideos: courseProgressCount?.completedVideos
          ? courseProgressCount?.completedVideos
          : [],
      },
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}


//get a list of coure for given instructor
exports.getInstructorCourses= async (req, res)=>{
  try{
    //get the instructor id from the authenticated user or requrest body
  const instructorId= req.user.id
  //find all courses belonging to the instructor 
  const instrucotrCourses= await Course.find({
    instructor:instructorId
  }).sort({createdAt: -1})

  //return the instructor's courses
  res.status(200).json({
    success:true,
    data:instrucotrCourses,
  })
  }catch(error){
    console.log(error);
    return res.status(500).json({
      success:false,
      error:error.message,
      message:"Failed to retrieve instructor courses"
    })
  }
}

//delete  the course
exports.deleteCourse= async(req, res)=>{
  try{
    const {courseId}= req.body;
    //find course
     const course= await Course.findById(courseId)
     if(!courseId){
      return res.status(404).json({
        message:"Course not found."
      })
     }

     //unenroll students from the course
     const studentEnrolled= course.studentsEnrolled
     for(const studentId of studentEnrolled){
        await User.findByIdAndUpdate(studentId, {
          $pull:{courses: courseId},
        })
     }

     //delete sections and sub-sections
     const courseSections= course.courseContent
     for(const sectionId of courseSections){
      //delete subsection of the section
      const section = await Section.findById(sectionId);
      if(section){
        const subSections= section.subSection
        for(const subSectionId of subSections){
          await SubSection.findByIdAndDelete(subSectionId)
        }
      }

      //delete the section
      await Section.findByIdAndDelete(sectionId);
     }
     //delete course
     await Course.findByIdAndDelete(courseId)

     return res.status(200).json({
      success:true,
      message:"Course deleted successfully."
     })

  }
  catch(error){
    console.error(error);
    return res.status(500).json({
      success:false,
      message:"internal server error",
      error:message.error
    })
  }
}