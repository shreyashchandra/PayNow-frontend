/* eslint-disable react/no-unknown-property */
/* eslint-disable no-unused-vars */
import { useState } from "react";
import { Button } from "../components/Button";
import { Heading } from "../components/Heading";
import { Inputbox } from "../components/Inputbox";
import { Subheading } from "../components/Subheading";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export const UpdateDetails = () => {
  const [firstName, setFirstName] = useState(null);
  const [lastName, setLastName] = useState(null);
  const [password, setpassword] = useState(null);

  const [tracker, setTracker] = useState(false);
  const navigate = useNavigate();

  const requestData = {};

  if (password !== null) {
    requestData.password = password;
  }
  if (firstName !== null) {
    requestData.firstName = firstName;
  }
  if (lastName !== null) {
    requestData.lastName = lastName;
  }

  async function updateFun() {
    try {
      setTracker(true);
      const res = await axios.put(
        "https://paynow-backend.onrender.com/api/v1/user/user-update",
        {
          requestData,
        },
        {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
        }
      );
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
      window.location.reload(false);
      setTracker(false);
    } catch (error) {
      console.log("Invalid credentials");
      setTracker(false);
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      <div className="p-28 w-full md:w-[550px] md:h-[600px] mt-20 mx-auto bg-slate-950 rounded-lg">
        <Heading title={"Update User"} />
        <Subheading lable={"Enter your new details to update your account"} />
        <Inputbox
          onChange={(e) => {
            setFirstName(e.target.value);
          }}
          lable={"First Name"}
          val={"Tony"}
        />
        <Inputbox
          onChange={(e) => {
            setLastName(e.target.value);
          }}
          lable={"Last Name"}
          val={"Stark"}
        />

        <Inputbox
          onChange={(e) => {
            setpassword(e.target.value);
          }}
          lable={"Password"}
          val={"secret"}
          type={"password"}
        />
        <Button
          onClick={updateFun}
          lable={
            tracker ? (
              <div className="flex justify-center  items-center">
                <div
                  className="animate-spin inline-block w-5 h-5 mr-4 border-[3px] border-current border-t-transparent text-white rounded-full "
                  role="status"
                  aria-label="loading"
                >
                  <span className="sr-only">Loading...</span>
                </div>
                <p>Updating...</p>
              </div>
            ) : (
              "Update"
            )
          }
        />
      </div>
    </div>
  );
};
