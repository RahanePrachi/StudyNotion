import React, { useState } from "react";
import { useForm } from "react-hook-form";
import IconBtn from "../../../../common/IconBtn";
import { IoAddCircleOutline } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { MdNavigateNext } from "react-icons/md";
import { setCourse, setEditCourse, setStep } from "../../../../../slices/courseSlice";
import toast from "react-hot-toast";
import NestedView from "./NestedView";
import { createSection, updateSection } from "../../../../../services/operations/couseDetailsAPI";
const CourseBuilderForm = () => {
  const [editSectionName, setEditSectionName] = useState(null);

  //below line is used for testing purpose 
  // const [editSectionName, setEditSectionName] = useState(true);
  const {course}=useSelector((state)=>state.course);
  const [loading, setLoading] = useState(false);
  const dispatch=useDispatch();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();
  const {token}=useSelector((state)=>state.auth);

  const cancelEdit= ()=>{
    setEditSectionName(null);
    setValue("sectionName", "");
  }
  const goToNext=()=>{
    // at least one section and videosection create hona hahiye tohi next pe ja sakte ho
    if(course.courseContent.length===0){
      toast.error("Please add atleast one section");
      return 
    }
    if(course.courseContent.some((section)=> section.subSection.length===0)){
      toast.error("Please add atleast one lecture in each section")
      return 
    }
    dispatch(setStep(3))

  }
  const goBack=()=>{
    dispatch(setStep(1));
    dispatch(setEditCourse(true));
    
  }
  const onSubmit= async( data)=>{
      setLoading(true);
      let result;

      if(editSectionName){
            // we are editing the section
            result =await updateSection({
              sectionName:data.sectionName,
              sectionId:editSectionName,
              courseId:course._id,
            }, token)
      }
      else{
        // means create section ka button hit kiya hai
        result = await createSection({
          sectionName:data.sectionName,
          courseId:course._id, 
        }, token)
      }
      console.log("Printing result after creating section: ", result);
      
      //update value

      if(result){
        dispatch(setCourse(result));
        setEditSectionName(null);
        setValue("sectionName", "");

      }
      setLoading(false);
  }

  const handleChangeEditSectionName=(sectionId, sectionName)=>{
    //here we are toggle the editSectionName value , agar set hai to unset kar rahe hai aur unset hai to set kar rahe hai
    if(editSectionName === sectionId){
        cancelEdit();
        return; 
    }
    console.log("Printing sectionName inside handleChangeEditSectionName: ", sectionName)
    setEditSectionName(sectionId);
    setValue("sectionName", sectionName);
  }
  return (
    <div className=" space-y-8 rounded-md border-[1px] border-richblack-700 bg-richblack-800 p-6">
      <p className="text-2xl font-semibold text-richblack-5">Course Builder</p>
      <form onSubmit={handleSubmit(onSubmit)} className=" space-y-4">
        <div className="flex flex-col space-y-2">
          <label htmlFor="sectionName" className="lable-style">
            Section Name <sup className="text-pink-200">*</sup>
          </label>
          <input
            type="text"
            id="sectionName"
            disabled={loading}
            placeholder="add section name"
            {...register("sectionName", { required: true })}
            className=" w-full form-style"
          />
          {errors.sectionName && <span className=" ml-2 text-xs tracking-wide text-pink-200">Section name is required. </span>}
        </div>
        <div className="flex items-end gap-x-4">
          <IconBtn
            
            type="submit"
            disabled={loading}
            text={editSectionName ? "Edit Section Name " : "Create Section"}
            outline={true}
            // customClasses={"text-white"}
            >
              <IoAddCircleOutline size={20} className="text-yellow-50"/>

            </IconBtn>
            {
              editSectionName &&(
                <button type="button" onClick={cancelEdit} className=" text-sm text-richblack-300 underline">
                  Cancel Edit
                </button>
              )
            }
        </div>
      </form>

      {/* nested view */}
            {
              course.courseContent.length>0 &&(
                <NestedView handleChangeEditSectionName={handleChangeEditSectionName}/>
              )
            }
            {/* next and prev button */}
            <div className="flex justify-end gap-x-3">
              <button onClick={goBack} className="flex cursor-pointer items-center gap-x-2 rounded-md bg-richblack-300 py-[8px] px-[20px] font-semibold text-richblack-900 ">Back</button>
              <IconBtn disabled={loading} text="Next" onclick={goToNext} >
                  <MdNavigateNext/>
              </IconBtn>
            </div>
    </div>
  );
};

export default CourseBuilderForm;
