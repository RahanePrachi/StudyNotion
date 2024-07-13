const mongoose= require("mongoose");

const ratingAndReview= new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"User",

    },
    rating:{
        type:Number,
        require:true,
    },
    review:{
        type:String,
        required:true,
        trim:true,
    },
    course: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
		ref: "Course",
		index: true,
	},
})

module.exports = mongoose.model("RatingAndReview", ratingAndReview);