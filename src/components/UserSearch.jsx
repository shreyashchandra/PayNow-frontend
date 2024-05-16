import { useEffect, useState } from "react";
import { DisplayUser } from "./DisplayUser";
import axios from "axios";

/* eslint-disable react/prop-types */
export const UserSearch = () => {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    axios
      .get(
        "https://paynow-backend.onrender.com/api/v1/user/bulk?filter=" + filter
      )
      .then((res) => {
        setUsers(res.data.user);
      });
  }, [filter]);

  return (
    <div className="p-3">
      <div>
        <h3 className="text-lg font-semibold text-slate-300">
          Users: ({users.length})
        </h3>
        <input
          onChange={(e) => {
            setFilter(e.target.value);
          }}
          type="text"
          placeholder="Search users..."
          className="w-full h-14 rounded-md border p-1 border-sky-600"
        />
      </div>

      {users.map((user) => (
        <DisplayUser
          key={user._id}
          fullName={`${user.firstName} ${user.lastName}`}
          id={user._id}
        />
      ))}
    </div>
  );
};
