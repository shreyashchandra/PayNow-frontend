import { useEffect, useState } from "react";
import { Appbar } from "../components/Appbar";
import { Balance } from "../components/Balance";
import { UserSearch } from "../components/UserSearch";
import axios from "axios";
import { Loader } from "../components/Loader";

export const Dashboard = () => {
  const [firstName, setFirstName] = useState("");
  const [balance, setBalance] = useState(null); // Use null to distinguish between "loading" and "zero balance"
  const [loading, setLoading] = useState(true); // Separate loading state for better control
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await axios.get(
          "https://paynow-backend.onrender.com/api/v1/bank/balance",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const data = response.data;
        setFirstName(data.firstName || "User");
        setBalance(data.balance || 0);
      } catch (err) {
        console.error("Error fetching balance:", err);
        setError("Failed to fetch balance. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 font-semibold">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Appbar nameFirstLetter={firstName[0]} />
      <Balance Userbalance={balance} />
      <UserSearch />
    </div>
  );
};
