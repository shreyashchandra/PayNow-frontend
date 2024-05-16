/* eslint-disable react/prop-types */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
export const Appbar = ({ nameFirstLetter }) => {
  const [isCLicked, setIsClicked] = useState(false);
  const navigate = useNavigate();
  function logOutFun() {
    localStorage.clear();
    navigate("/signin");
    window.location.reload(false);
  }
  return (
    <div className="flex items-center justify-between border-b-2 border-slate-300 px-5">
      <h1 className="text-2xl font-bold  text-sky-600 cursor-default">
        PayNow
      </h1>
      <div className="flex items-center font-bold">
        <h3 className=" text-gray-300 ">Hello,</h3>
        <div className=" cursor-pointer text-white font-bold m-3 w-5 h-5 bg-sky-600 rounded-full flex justify-center items-center text-center p-5 shadow-xl hover:bg-sky-500 relative">
          <div onClick={() => setIsClicked((prev) => !prev)}>
            {nameFirstLetter}
          </div>
          {isCLicked && (
            <div className="absolute p-2 mt-20 bg-gray-500 rounded-xl opacity-50 hover:bg-gray-800">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/update-details");
                }}
              >
                Update
              </div>
            </div>
          )}
        </div>
        <div
          onClick={logOutFun}
          className=" cursor-pointer text-white font-bold m-3 w-16 h-5 bg-sky-600 rounded-md flex justify-center items-center text-center p-5 shadow-xl"
        >
          Logout
        </div>
      </div>
    </div>
  );
};
