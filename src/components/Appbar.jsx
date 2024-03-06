/* eslint-disable react/prop-types */
import { useNavigate } from "react-router-dom";
export const Appbar = ({ nameFirstLetter }) => {
  const navigate = useNavigate();
  function logOutFun() {
    localStorage.clear();
    navigate("/signin");
    window.location.reload(false);
  }
  return (
    <div className="flex items-center justify-between p-5 border-b-2 border-slate-300">
      <h1 className="text-2xl font-bold  text-sky-600 cursor-default">
        PayNow
      </h1>
      <div className="flex items-center font-bold">
        <h3 className=" text-gray-500 ">Hello,</h3>
        <div className=" cursor-pointer text-white font-bold m-3 w-5 h-5 bg-sky-600 rounded-full flex justify-center items-center text-center p-5 shadow-xl">
          {nameFirstLetter}
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
