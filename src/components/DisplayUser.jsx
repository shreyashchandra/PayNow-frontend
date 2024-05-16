/* eslint-disable no-undef */
/* eslint-disable react/prop-types */

import { useNavigate } from "react-router-dom";

export const DisplayUser = ({ fullName, id }) => {
  const navigate = useNavigate();
  return (
    <div className="text-sm md:text-lg flex px-20 py-7 justify-between items-center font-bold  w-full mt-3 rounded-md">
      <div className="flex gap-2 items-center">
        <h3 className="text-white font-bold m-3 w-5 h-5 bg-sky-600 rounded-full flex justify-center items-center text-center p-5 shadow-xl">
          {fullName[0]}
        </h3>
        <h2 className=" text-gray-500 ">{fullName}</h2>
      </div>

      <button
        onClick={() => {
          navigate("/send?id=" + id + "&name=" + fullName);
        }}
        className=" flex items-center justify-center text-xs md:text-lg font-semibold p-2 md:p-4 bg-sky-600 text-white w-24 h-14 md:w-40 rounded-md hover:bg-sky-500"
      >
        Send Money
      </button>
    </div>
  );
};
