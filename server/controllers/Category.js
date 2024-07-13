const Category = require("../models/Category");
function getRandomInt(max) {
    return Math.floor(Math.random() * max)
  }
exports.createCategory = async (req, res) => {
	try {
		//fetch data
		const { name, description } = req.body;

		//validation
		if (!name) {
			return res
				.status(400)
				.json({ success: false, message: "All fields are required" });
		}

		//create entry in DB
		const CategorysDetails = await Category.create({
			name: name,
			description: description,
		});
		console.log(CategorysDetails);

		//return response
		return res.status(200).json({
			success: true,
			message: "Categorys Created Successfully",
		});
		
	} catch (error) {
		return res.status(500).json({
			success: true,
			message: error.message,
		});
	}
};

exports.showAllCategories = async (req, res) => {
	try {
		const allCategorys = await Category.find(
			{},
			{ name: true, description: true }
		);
		res.status(200).json({
			success: true,
			data: allCategorys,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

const getAverageRating = (ratingAndReviews) => {
  if (!ratingAndReviews || ratingAndReviews.length === 0) return 0;
  const totalRating = ratingAndReviews.reduce((acc, review) => acc + (review.rating || 0), 0);
  return totalRating / ratingAndReviews.length;
};
exports.categoryPageDetails = async (req, res) => {
    try {
      const { categoryId } = req.body
      console.log("PRINTING CATEGORY ID: ", categoryId);
      // Get courses for the specified category
      const selectedCategory = await Category.findById(categoryId)
        .populate({
          path: "courses",
          match: { status: "Published" },
          populate: "ratingAndReviews",
        })
        .exec()
  
      //console.log("SELECTED COURSE", selectedCategory)
      // Handle the case when the category is not found
      if (!selectedCategory) {
        console.log("Category not found.")
        return res
          .status(404)
          .json({ success: false, message: "Category not found" })
      }
      // Handle the case when there are no courses
      if (selectedCategory.courses.length === 0) {
        console.log("No courses found for the selected category.")
        return res.status(404).json({
          success: false,
          message: "No courses found for the selected category.",
        })
      }
  
      // Get courses for other categories
      const categoriesExceptSelected = await Category.find({
        _id: { $ne: categoryId },
      })
      let differentCategory = await Category.findOne(
        categoriesExceptSelected[getRandomInt(categoriesExceptSelected.length)]
          ._id
      )
        .populate({
          path: "courses",
          match: { status: "Published" },
          populate: "ratingAndReviews",
        })
        .exec()
        console.log("Different COURSE", differentCategory)
      // Get top-selling courses across all categories
      const allCategories = await Category.find()
        .populate({
          path: "courses",
          match: { status: "Published" },
          populate: "ratingAndReviews",
          populate: {
            path: "instructor",
        },

        })
        .exec()
   console.log("Printing all categories: ", allCategories);
      const allCourses = allCategories.flatMap((category) => category.courses ) 
      const mostSellingCourses = allCourses
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 10)
        .map(course => ({
          ...course.toObject(),
          averageRating: getAverageRating(course.ratingAndReviews),
          ratingAndReviews: course.ratingAndReviews,  // Include rating and review array
        }));
        
    console.log("mostSellingCourses COURSE", mostSellingCourses)
      res.status(200).json({
        success: true,
        data: {
          selectedCategory,
          differentCategory,
          mostSellingCourses,
        },
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      })
    }
  }

// exports.categoryPageDetails = async (req, res) => {
// 	try {
// 		const { categoryId } = req.body;

// 		// Get courses for the specified category
// 		const selectedCategory = await Category.findById(categoryId)
// 			.populate({
// 				path: "courses",
// 				match: { status: "Published" },
// 				populate: "ratingAndReviews",
// 			  })
// 			.exec();
// 		console.log("printing selected category: ", selectedCategory);
// 		// Handle the case when the category is not found
// 		if (!selectedCategory) {
// 			console.log("Category not found.");
// 			return res
// 				.status(404)
// 				.json({ success: false, message: "Category not found" });
// 		}
// 		// Handle the case when there are no courses
// 		if (selectedCategory.courses.length === 0) {
// 			console.log("No courses found for the selected category.");
// 			return res.status(404).json({
// 				success: false,
// 				message: "No courses found for the selected category.",
// 			});
// 		}

// 		const selectedCourses = selectedCategory.courses;

// 		// Get courses for other categories
// 		const categoriesExceptSelected = await Category.find({
// 			_id: { $ne: categoryId },
// 		}).populate("courses");
// 		let differentCourses = [];
// 		for (const category of categoriesExceptSelected) {
// 			differentCourses.push(...category.courses);
// 		}

// 		// Get top-selling courses across all categories
// 		const allCategories = await Category.find().populate("courses");
// 		const allCourses = allCategories.flatMap((category) => category.courses);
// 		const mostSellingCourses = allCourses
// 			.sort((a, b) => b.sold - a.sold)
// 			.slice(0, 10);

// 		res.status(200).json({
// 			success:true,
// 			selectedCourses: selectedCourses,
// 			differentCourses: differentCourses,
// 			mostSellingCourses: mostSellingCourses,
// 		});
// 	} catch (error) {
// 		return res.status(500).json({
// 			success: false,
// 			message: "Internal server error",
// 			error: error.message,
// 		});
// 	}
// };


// exports.categoryPageDetails = async (req, res) => {
//     try {
//             //get categoryId
//             const {categoryId} = req.body;
//             //get courses for specified categoryId
//             const selectedCategory = await Category.findById(categoryId)
//                         .populate("courses")
//                         .exec();
//             //validation
//             if(!selectedCategory) {
//                 return res.status(404).json({
//                     success:false,
//                     message:'Data Not Found',
//                 });
//             }
//             //get coursesfor different categories
//             const differentCategories = await Category.find({
//                             _id: {$ne: categoryId},
//                          })
//                         .populate("courses")
//                         .exec();

//             //get top 10 selling courses
//             //HW - write it on your own

//             //return response
//             return res.status(200).json({
//                 success:true,
//                 data: {
//                     selectedCategory,
//                     differentCategories,
//                 },
//             });

//     }
//     catch(error ) {
//         console.log(error);
//         return res.status(500).json({
//             success:false,
//             message:error.message,
//         });
//     }
// }

//2 task , contact us page me send message pe click karne ke bad 2 mail , one for the student for confirmation data receive , and another to the codehelp with student data and message

//create routes -> 3 thing ->need to know method , path, handler function
//try to create index.js file