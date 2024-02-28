/* eslint-disable react/prop-types */
import { useSearchParams } from "react-router-dom";
export const SendDisplayUser = () => {
  const [searchParams] = useSearchParams();
  const fullName = searchParams.get("name");
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center font-bold w-96 mt-4 md-0 rounded-md">
        <h3 className="text-white font-bold m-3 w-5 h-5 bg-sky-600 rounded-full flex justify-center items-center text-center p-5 shadow-xl">
          {fullName[0]}
        </h3>
        <h2>{fullName}</h2>
      </div>
    </div>
  );
};
