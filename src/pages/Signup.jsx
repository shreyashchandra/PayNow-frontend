/* eslint-disable no-unused-vars */
import { useState } from "react";
import { Button } from "../components/Button";
import { Heading } from "../components/Heading";
import { Inputbox } from "../components/Inputbox";
import { Subheading } from "../components/Subheading";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export const Signup = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setpassword] = useState("");
  const navigate = useNavigate();

  async function signUpFun() {
    const res = await axios.post(
      "https://paynow-backend.onrender.com/api/v1/user/signup",
      {
        username,
        password,
        firstName,
        lastName,
      }
    );
    localStorage.setItem("token", res.data.token);
    navigate("/dashboard");
  }

  function toSignIn() {
    navigate("/signin");
  }

  return (
    <div className="p-28 w-[550px] h-[650px] mt-16 mx-auto bg-white">
      <Heading title={"SignUp"} />
      <Subheading lable={"Enter your details to create an account"} />
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
          setUsername(e.target.value);
        }}
        lable={"Email"}
        val={"tony@gmail.com"}
      />
      <Inputbox
        onChange={(e) => {
          setpassword(e.target.value);
        }}
        lable={"Password"}
        val={"secret"}
      />
      <Button onClick={signUpFun} lable={"SignUp"} />
      <p className="text-sm text-gray-500 mt-1 text-center">
        Already have an account?{" "}
        <a onClick={toSignIn} className="underline font-bold cursor-pointer">
          SignIn
        </a>
      </p>
    </div>
  );
};
