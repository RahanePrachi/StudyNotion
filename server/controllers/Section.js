
const Section= require("../models/Section");
const  Course=require("../models/Course");
const SubSection = require("../models/SubSection");

exports.createSection = async (req, res) => {
	try {
		// Extract the required properties from the request body
		let { sectionName, courseId } = req.body;
        console.log(sectionName);
		// Validate the input
		if (!sectionName || !courseId) {
			return res.status(400).json({
				success: false,
				message: "Missing required properties",
			});
		}

		// Create a new section with the given name
		const newSection = await Section.create({ sectionName });

         console.log("NewSection : ", newSection);
		// Add the new section to the course's content array
		const updatedCourse = await Course.findByIdAndUpdate(
			courseId,
			{
				$push: {
					courseContent: newSection._id,
				},
			},
			{ new: true }
		)
			.populate({
				path: "courseContent",
				populate: {
					path: "subSection",
				},
			})
			.exec();

		// Return the updated course object in the response
		res.status(200).json({
			success: true,
			message: "Section created successfully",
			updatedCourse,
		});
	} catch (error) {
		// Handle errors
		res.status(500).json({
			success: false,
			message: "Internal server error",
			error: error.message,
		});
	}
};




exports.updateSection= async(req, res)=>{
    try{
        //fetch data
        const {sectionName, sectionId, courseId }=req.body;

        //data validation
        if(!sectionName || !sectionId){
            return res.status(400).json({
                success:false,
                message:"missing properties"
            })
        }
        //update data
        const section= await Section.findByIdAndUpdate(sectionId, {sectionName}, {new:true})
        console.log("Section :", section);

        const course= await Course.findById(courseId).populate({
            path:"courseContent",
            populate:{
                path:"subSection",
            },
        })
        .exec();
        //return res
        res.status(200).json({
            success:true,
            // message:"Section updated successfully."
            message: section,
            data:course,
        })

    }
    catch(error){
        res.status(500).json({
            success:false,
            message:"unable to update a section please try again",
            error:error.message
        })
    }
}

//delete section
exports.deleteSection= async (req, res)=>{
    try{
        //get id=> assuming that we are sending id in params
        const {sectionId, courseId}= req.body;
    

        //TODO[Testing] => do we need to delete the entry from the course schema 
        await Course.findByIdAndUpdate(courseId, {
            $pull:{
                courseContent:sectionId, 
            }
        })

        const section=await Section.findByIdAndDelete(sectionId)
        console.log("sectionId: ", sectionId, "courseId : ", courseId);

        if(!section) {
			return res.status(404).json({
				success:false,
				message:"Section not Found",
			})
		}

        //delte sub section
        await SubSection.deleteMany({_id:{$in:section.subSection}})

        // await Section.findByIdAndDelete(sectionId);
        //find the updated course and return 
        const course= await Course.findById(courseId).populate({
            path:"courseContent",
            populate:{
                path:"subSection",
            }
        }).exec();

        //return response
        return res.status(200).json({
            success:true,
            message:"Section deleted successfully.",
            data:course,
        })


    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"something went wrong while deleting the section."
        })
    }
}


