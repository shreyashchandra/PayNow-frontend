import { Button } from "../components/Button";
import { Heading } from "../components/Heading";
import { Inputbox } from "../components/Inputbox";
import { SendDisplayUser } from "../components/SendDisplayUser";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useState } from "react";

export const RequestMoney = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const [amount, setAmount] = useState(0);
  const [tracker, setTracker] = useState(false);
  const navigate = useNavigate();

  async function requestMoneyFun() {
    setTracker(true);
    try {
      console.log("Sending request with amount:", amount, "toId:", id);
      const token = localStorage.getItem("token");
      console.log("Token:", token); // Log the token

      const res = await axios.post(
        "https://paynow-backend.onrender.com/api/v1/bank/create/request",
        {
          amount: amount,
          toId: id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("API Response:", res); // Log the full API response

      if (res.status === 200) {
        alert("Money Transferred Successfully");
        navigate("/dashboard");
      } else {
        alert(`Transfer failed: ${res.data.msg || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error requesting money:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setTracker(false); // Reset the tracker
    }
  }

  return (
    <div className="p-28 w-full md:w-[550px] md:h-[600px] mt-20 mx-auto bg-slate-950 rounded-lg text-slate-200">
      <Heading title={"Request Money"} />
      <SendDisplayUser />
      <Inputbox
        onChange={(e) => {
          setAmount(Number(e.target.value));
        }}
        lable={"Amount in (Rs)"}
        val={"eg. ₹1100"}
      />
      <Button
        onClick={requestMoneyFun}
        lable={
          tracker ? (
            <div className="flex justify-center items-center">
              <div
                className="animate-spin inline-block w-5 h-5 mr-4 border-[3px] border-current border-t-transparent rounded-full"
                role="status"
                aria-label="loading"
              >
                <span className="sr-only">Loading...</span>
              </div>
              <p>Request Money</p>
            </div>
          ) : (
            "Request Money"
          )
        }
      />
    </div>
  );
};
