import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const RequirementField = ({
  name,
  label,
  register,
  setValue,
  errors,
  getValues,
}) => {
  const { editCourse, course } = useSelector((state) => state.course);
  const [requirement, setRequirement] = useState("");
  const [requirementList, setRequirementList] = useState([]);

  useEffect(() => {
    if (editCourse) {
      setRequirementList(course?.instructions);
    }
    register(name, {
      required: true,
      validate: (value) => value.length > 0,
    });
  }, []);
  useEffect(() => {
    setValue(name, requirementList);
  }, [requirementList]);

  const handleAddRequirement = () => {
    if (requirement) {
      setRequirementList([...requirementList, requirement]);
      setRequirement("");
    }
  };
  const handleRemoveRequirement = (index) => {
    const updatedRequirements = [...requirementList];
    updatedRequirements.splice(index, 1);
    setRequirementList(updatedRequirements);
  };
  return (
    <div>
      <label htmlFor={name} className="lable-style">
        {label} <sup className="text-pink-200">*</sup>
      </label>

      <div>
        <input
          type="text"
          id={name}
          value={requirement}
          onChange={(e) => setRequirement(e.target.value)}
          className=" form-style w-full"
        />

        <button
          type="button"
          onClick={handleAddRequirement}
          className="font-semibold text-yellow-50"
        >
          Add
        </button>
      </div>
      {requirementList.length > 0 && (
        <ul>
          {requirementList.map((requirement, index) => (
            <li key={index} className=" flex items-center text-richblack-5">
              <span> {requirement}</span>
              <button
                type="button"
                onClick={() => handleRemoveRequirement(index)}
                className=" ml-2 text-xs text-pure-greys-300"
              >
                clear
              </button>
            </li>
          ))}
        </ul>
      )}
      {errors[name] && (
        <span className="ml-2 text-xs tracking-wide text-pink-200">
          {label} is required
        </span>
      )}
    </div>
  );
};

export default RequirementField;
