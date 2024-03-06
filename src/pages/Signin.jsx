import { Button } from "../components/Button";
import { Heading } from "../components/Heading";
import { Inputbox } from "../components/Inputbox";
import { Subheading } from "../components/Subheading";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useState } from "react";

export const Signin = () => {
  const [username, setUsername] = useState("");
  const [password, setpassword] = useState("");
  const [tracker, setTracker] = useState(false);
  const navigate = useNavigate();
  async function signInFun() {
    try {
      setTracker(true);
      const res = await axios.post(
        "https://paynow-backend.onrender.com/api/v1/user/signin",
        {
          username,
          password,
        }
      );
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
      window.location.reload(false);
      setTracker(false);
    } catch (error) {
      alert("Invalid credentials");
      setTracker(false);
    }
  }

  return (
    <div className="p-28 w-[550px] h-[600px] mt-16 mx-auto bg-white">
      <Heading title={"SignIn"} />
      <Subheading lable={"Enter your details to SignIn"} />
      <Inputbox
        onChange={(e) => setUsername(e.target.value)}
        lable={"Email"}
        val={"tony@gmail.com"}
      />
      <Inputbox
        onChange={(e) => setpassword(e.target.value)}
        lable={"Password"}
        val={"secret"}
      />
      <Button
        onClick={signInFun}
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
              <p>Signing up...</p>
            </div>
          ) : (
            "SignIn"
          )
        }
      />
      <p className="text-sm text-gray-500 mt-1 text-center">
        Dont have an account?{" "}
        <a
          onClick={() => navigate("/signup")}
          className="underline font-bold cursor-pointer"
        >
          SignUp
        </a>
      </p>
    </div>
  );
};
