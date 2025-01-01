/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export const Appbar = ({ nameFirstLetter }) => {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const toUpdateUser = () => {
    navigate("/update-user");
  };

  const logOutFun = () => {
    localStorage.clear();
    navigate("/signin");
    window.location.reload(false);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const handlePayNow = (requestFromId, requesterName) => {
    navigate(`/send?id=${requestFromId}&name=${requesterName}`);
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axios.get(
          "https://backend.paynow.shreyash.space/api/v1/bank/request/list",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        const { data } = response.data;

        // Transforming data into notification messages
        const transformedNotifications = data.map((item) => {
          const requesterName = item.requestFromIdId?.firstName || "Someone";
          const requestFromId = item.requestFromIdId?._id || null;
          const amount = item.amountRequested || 0;
          return {
            id: item._id,
            message: `${requesterName} requested ${amount} from you`,
            requestFromId: requestFromId,
            requesterName: requesterName,
          };
        });

        setNotifications(transformedNotifications);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };

    fetchNotifications();
  }, []);

  return (
    <div className="flex items-center justify-between border-b-2 border-slate-300 px-5 py-5">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-sky-600 cursor-default">
        PayNow
        <span>
          <img
            src="./wallet-pay.svg"
            alt="PayNow Logo"
            className="w-10 invert"
          />
        </span>
      </h1>
      <div className="flex items-center font-bold">
        <h3 className="text-gray-300">Hello,</h3>
        <div className="relative">
          <div
            className=" relative group cursor-pointer text-white font-bold m-3 w-5 h-5 bg-sky-600 rounded-full flex justify-center items-center text-center p-5 shadow-xl hover:bg-sky-500"
            onClick={toUpdateUser}
          >
            {nameFirstLetter}
            <span className="absolute bottom-full mb-1 w-max px-2 py-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 transition-opacity">
              Update Profile
            </span>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={toggleNotifications}
            className="text-sky-600 hover:text-sky-700 focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </button>
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg overflow-hidden z-20">
              {notifications.length > 0 ? (
                <div className="py-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="flex justify-between items-center px-4 py-2 hover:bg-gray-100"
                    >
                      <p className="text-sm text-gray-700">
                        {notification.message}
                      </p>
                      <button
                        onClick={() =>
                          handlePayNow(
                            notification.requestFromId,
                            notification.requesterName
                          )
                        }
                        className="text-sm text-white bg-sky-600 rounded-md px-2 py-1 hover:bg-sky-500"
                      >
                        Pay Now
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 px-4 text-gray-500 text-sm text-center">
                  No notifications.
                </div>
              )}
            </div>
          )}
        </div>
        <div
          onClick={logOutFun}
          className="cursor-pointer text-white font-bold m-3 w-16 h-5 bg-sky-600 rounded-md flex justify-center items-center text-center p-5 shadow-xl hover:bg-sky-500"
        >
          Logout
        </div>
      </div>
    </div>
  );
};
