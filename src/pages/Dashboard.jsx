import { useEffect, useState } from "react";
import { Appbar } from "../components/Appbar";
import { Balance } from "../components/Balance";
import { UserSearch } from "../components/UserSearch";
import axios from "axios";

export const Dashboard = () => {
  const [firstName, setFirstName] = useState("");
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    try {
      axios
        .get("https://paynow-backend.onrender.com/api/v1/bank/balance", {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
        })
        .then((response) => {
          const data = response.data; // Access the response data
          setFirstName(data.firstName);
          setBalance(data.balance);
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
        });
    } catch (error) {
      alert(error);
    }
  }, []);

  return (
    <div>
      <Appbar nameFirstLetter={firstName[0]} />
      <Balance Userbalance={balance} />
      <UserSearch />
    </div>
  );
};
