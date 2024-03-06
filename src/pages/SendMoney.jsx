import { Button } from "../components/Button";
import { Heading } from "../components/Heading";
import { Inputbox } from "../components/Inputbox";
import { SendDisplayUser } from "../components/SendDisplayUser";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useState } from "react";

export const SendMoney = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const [amount, setAmount] = useState(0);
  const [tracker, setTracker] = useState(false);
  const navigate = useNavigate();

  async function sendMoneyFun() {
    setTracker(true);
    const res = await axios.post(
      "https://paynow-backend.onrender.com/api/v1/bank/transfer",
      {
        amount_to_transfer: amount,
        paye_id: id,
      },
      {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      }
    );
    if (res.data.msg === "Transfer successful") {
      navigate("/dashboard");
      setTracker(true);
      alert("Money Transfered Successfully");
    }
  }

  return (
    <div className="p-28 w-[550px] h-[600px] mt-16 mx-auto bg-white">
      <Heading title={"Send Money"} />
      <SendDisplayUser />
      <Inputbox
        onChange={(e) => {
          setAmount(Number(e.target.value));
        }}
        lable={"Amount in (Rs)"}
        val={"eg. ₹1100"}
      />
      <Button
        onClick={sendMoneyFun}
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
              <p>Intiate Transfer</p>
            </div>
          ) : (
            "SignIn"
          )
        }
      />
    </div>
  );
};
