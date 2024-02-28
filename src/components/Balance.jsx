/* eslint-disable react/prop-types */

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWallet } from "@fortawesome/free-solid-svg-icons";

export const Balance = ({ Userbalance }) => {
  return (
    <div className="mt-3 p-5 ">
      <h2 className=" flex items-center justify-center text-lg font-bold p-5 bg-sky-600 text-white w-40 h-14 rounded-md hover:bg-sky-500">
        <p className="p-2">Wallet</p>
        <FontAwesomeIcon icon={faWallet} />
      </h2>
      <h3 className="text-xl mt-3 font-bold">
        Balance: <span className="font-semibold"> ₹ {Userbalance}</span>{" "}
      </h3>
    </div>
  );
};
