/* eslint-disable no-undef */
/* eslint-disable react/prop-types */

import { useNavigate } from "react-router-dom";

export const DisplayUser = ({ fullName, id }) => {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center font-bold bg-neutral-300 w-96 mt-3 rounded-md">
        <h3 className="text-white font-bold m-3 w-5 h-5 bg-sky-600 rounded-full flex justify-center items-center text-center p-5 shadow-xl">
          {fullName[0]}
        </h3>
        <h2 className=" text-gray-500 ">{fullName}</h2>
      </div>
      <button
        onClick={() => {
          navigate("/send?id=" + id + "&name=" + fullName);
        }}
        className=" flex items-center justify-center text-lg font-bold p-5 bg-sky-600 text-white w-40 h-14 rounded-md hover:bg-sky-500"
      >
        Send Money
      </button>
    </div>
  );
};
