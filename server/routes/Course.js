//importing the required modules
const express = require("express");
const router = express.Router();

//import the controllers

//course controller import
const {
  createCourse,
  showAllCourses,
  getCourseDetails,
  editCourse,
  getInstructorCourses,
  deleteCourse,
  getFullCourseDetails,
} = require("../controllers/Course");

//categories controller import
const {
  categoryPageDetails,
  showAllCategories,
  createCategory,
} = require("../controllers/Category");

// Sections Controllers Import
const {
  createSection,
  updateSection,
  deleteSection,
} = require("../controllers/Section");

// Sub-Sections Controllers Import
const {
  createSubSection,
  updateSubSection,
  deleteSubSection,
} = require("../controllers/Subsection");

// Rating Controllers Import
const {
  createRating,
  getAverageRating,
  getAllRatingAndReview,
} = require("../controllers/RatingAndReview");

// const {
//   updateCourseProgress
// } = require("../controllers/courseProgress");

const {updateCourseProgress}= require("../controllers/courseProgress");
const {
  isInstructor,
  isStudent,
  auth,
  isAdmin,
} = require("../middleware/auth");

/********course routes********* */

//courses can only be created by instructer
router.post("/createCourse", auth, isInstructor, createCourse);
//add a section to a course
router.post("/addSection", auth, isInstructor, createSection);
//update a section
router.post("/updateSection", auth, isInstructor, updateSection);
//delete a section
router.delete("/deleteSection", auth, isInstructor, deleteSection);
//edit subsection
router.post("/updateSubSection", auth, isInstructor, updateSubSection);
// Delete Sub Sectionss
router.post("/deleteSubSection", auth, isInstructor, deleteSubSection);
// Add a Sub Section to a Section
router.post("/addSubSection", auth, isInstructor, createSubSection);
// Get all Registered Courses
router.get("/getAllCourses", showAllCourses);
// Get Details for a Specific Courses
router.post("/getCourseDetails", getCourseDetails);

router.post("/updateCourseProgress", auth, isStudent, updateCourseProgress);

router.post("/editCourse", auth, isInstructor, editCourse);
router.get("/getInstructorCourses", auth, isInstructor, getInstructorCourses)
router.post("/getFullCourseDetails", auth,  getFullCourseDetails)
//delete a course
router.delete("/deleteCourse", deleteCourse);
/******Category routes (only for admin) ****/
// Category can Only be Created by Admin
// TODO: Put IsAdmin Middleware here
router.post("/createCategory", auth, isAdmin, createCategory);
router.get("/showAllCategories", showAllCategories);
router.post("/getCategoryPageDetails", categoryPageDetails);

/******Rating and review *******/

router.post("/createRating", auth, isStudent, createRating);
router.get("/getAverageRating", getAverageRating);
router.get("/getReviews", getAllRatingAndReview);

module.exports = router;
