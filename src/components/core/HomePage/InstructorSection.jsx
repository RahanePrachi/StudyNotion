import React from 'react'
import  Instructor from "../../../assets/Images/Instructor.png"
import HighLightText from './HighLightText'
import { FaArrowRight } from 'react-icons/fa'
import CTAButton from "../HomePage/Button"
const InstructorSection = () => {
  return (
    <div >
      <div className='flex flex-col lg:flex-row gap-20 items-center'>
        {/* left */}
        <div className='lg:w-[50%]'>
            <img src={Instructor}
            alt="instroctorImage"
            className=' shadow-[-20px_-20px_0_0] shadow-white'/>
        </div>
        {/* Right */}
        <div className='lg:w-[50%] flex flex-col gap-10'>
            <div className='lg:w-[50%] text-4xl font-semibold'>Become an 
                <HighLightText text={"Instructor"}/>
            </div>
            <p className='font-medium text-[16px] w-[90%] text-richblack-300'>Instructors from around the world teach millions of students on StudyNotion. We provide the tools and skills to teach what you love.</p>

            <div className='w-fit'>
            <CTAButton active={true} linkto={"./signup"}>
                <div className='flex flex-row gap-3 items-center'>
                    Start Learning Today 
                    <FaArrowRight/>
                </div>
            </CTAButton>
            </div>
        </div>
      </div>
    </div>
  )
}

export default InstructorSection
