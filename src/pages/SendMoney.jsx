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
  const navigate = useNavigate();
  async function sendMoneyFun() {
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
      <Button onClick={sendMoneyFun} lable={"Initiate Transfer"} />
    </div>
  );
};
