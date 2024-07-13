const Section=require('../models/Section');
const SubSection=require('../models/SubSection');
const { uploadImageCloudinary } = require('../utils/imageUploader');

//create subsection
exports.createSubSection= async (req, res)=>{
    try{
        //fetch data from req.body
        const {sectionId, title, description}= req.body;

        console.log("request body data : ", sectionId, title, description);
        //extract file/video
        const video= req.files.video;

        //validation
        if(!sectionId || !title || !video || !description){
            return res.status(400).json({
                success:false,
                message:"all fields are required",
            })
        }
        console.log(video)
        //upload video to cloudinary -> to secure url
        const uploadDetails= await uploadImageCloudinary(video, process.env.FOLDER_NAME);
        console.log("uploadDetails : " , uploadDetails)
        //create a subsection
        const subSectionDetails=await SubSection.create({
            title:title,
            timeDuration: `${uploadDetails.duration}`,
            description:description,
            videoUrl:uploadDetails.secure_url,
        })

        //update section with this sub section objectid
        const updatedSection = await Section.findByIdAndUpdate({_id:sectionId},
                                                                {
                                                                    $push:{
                                                                        subSection:subSectionDetails._id,
                                                                    }
                                                                },
                                                                {new:true}).populate("subSection")

        //HW :  log updated secton here, after here, after adding populate query
        //return response
        return res.status(200).json({
            success:true,
            message:"subsection create successfully",
            data: updatedSection,
        })


    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"Internal server error",
            error:error.message,
            
        })
    }
}

//HW -> update subsection
// exports.updateSubSection= async(req, res)=>{
//     try{
//          //fetch data from req.body
//          const {sectionId, title, timeDuration , description}= req.body;

//           //validation
//         if(!sectionId || !title || !timeDuration || !description){
//             return res.status(400).json({
//                 success:false,
//                 message:"all fields are required",
//             })
//         }

//         //update subsection
//         const newSubsection= await Section.findByIdAndUpdate({_id:sectionId});

//         //return response
//         return res.status(200).json({
//             success:true,
//             message:"subsection updated successfully.",
//             newSubsection,
//         })


//     }
//     catch(error){
//         return res.status(500).json({
//             success:false,
//             message:"Internal server error",
//             error:error.message,
            
//         })
//     }
// }

//server 7 file code
exports.updateSubSection = async (req, res) => {
    try {
      const { sectionId, title, description , subSectionId} = req.body
      const subSection = await SubSection.findById(subSectionId)
  
      if (!subSection) {
        return res.status(404).json({
          success: false,
          message: "SubSection not found",
        })
      }
  
      if (title !== undefined) {
        subSection.title = title
      }
  
      if (description !== undefined) {
        subSection.description = description
      }
      if (req.files && req.files.video !== undefined) {
        const video = req.files.video
        const uploadDetails = await uploadImageCloudinary(
          video,
          process.env.FOLDER_NAME
        )
        subSection.videoUrl = uploadDetails.secure_url
        subSection.timeDuration = `${uploadDetails.duration}`
      }
  
      await subSection.save()
  
      const updatedSection=await Section.findById(sectionId).populate("subSection")
      return res.json({
        success: true,
        message: "Section updated successfully",
        data:updatedSection,
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({
        success: false,
        message: "An error occurred while updating the section",
      })
    }
  }

//HW -> delete subsection
// exports.deleteSubSection= async(req, res)=>{
//     try{
//         //get subsection by id
//         const subSectionId=req.params;
    
//         //validate
//         if(!subSectionId){
//             return res.status(402).json({
//                 success:false,
//                 message:"subsection id not found."
//             })
//         }
//         //delete
//         await Section.findByIdAndDelete(subSectionId);
//         //return res
//         return res.status(200).json({
//             success:true,
//             message:"Subsection deleted successfully."
//         })
//     }
//     catch(error){
//         return res.status(500).json({
//             success :false,
//             message:"error occurs while deleting the subsection."
//         })
//     }
// }

//server 7 file code
exports.deleteSubSection = async (req, res) => {
    try {
      const { subSectionId, sectionId } = req.body
      await Section.findByIdAndUpdate(
        { _id: sectionId },
        {
          $pull: {
            subSection: subSectionId,
          },
        }
      )
      const subSection = await SubSection.findByIdAndDelete({ _id: subSectionId })
  
      if (!subSection) {
        return res
          .status(404)
          .json({ success: false, message: "SubSection not found" })
      }

      const updatedSection=await Section.findById(sectionId).populate("subSection")
      return res.json({
        success: true,
        message: "SubSection deleted successfully",
        data:updatedSection,
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({
        success: false,
        message: "An error occurred while deleting the SubSection",
      })
    }
  }