/* eslint-disable no-undef */
/* eslint-disable react/prop-types */

import { useNavigate } from "react-router-dom";

export const DisplayUser = ({ fullName, id }) => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center text-center w-64 p-6 bg-white shadow-lg rounded-lg mt-3">
      {/* Initial Letter in a Circle */}
      <div className="w-16 h-16 flex items-center justify-center bg-sky-600 text-white font-bold rounded-full text-2xl shadow-md">
        {fullName[0].toUpperCase()}
      </div>

      {/* Full Name */}
      <h2 className="mt-4 text-lg font-semibold text-gray-700">{fullName}</h2>

      {/* Send Money Button */}
      <button
        onClick={() => {
          navigate(`/send?id=${id}&name=${fullName}`);
        }}
        className="mt-4 text-sm font-medium text-white bg-sky-600 py-2 px-6 rounded-md hover:bg-sky-500"
      >
        Send Money
      </button>
      <button
        onClick={() => {
          navigate(`/request?id=${id}&name=${fullName}`);
        }}
        className="mt-4 text-sm font-medium text-white bg-sky-600 py-2 px-6 rounded-md hover:bg-sky-500"
      >
        Request Money
      </button>
    </div>
  );
};
