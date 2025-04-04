import { useEffect, useState } from "react";
import { DisplayUser } from "./DisplayUser";
import axios from "axios";

/* eslint-disable react/prop-types */
export const UserSearch = () => {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1); // Current page
  const [totalPages, setTotalPages] = useState(1); // Total pages available

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        ` https://paynow-backend.onrender.com/api/v1/user/bulk`,
        {
          params: {
            filter,
            page,
            limit: 12, // Number of users per page
          },
        }
      );
      setUsers(res.data.users || []);
      setTotalPages(res.data.totalPages || 1); // Assuming backend returns total pages
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filter, page]);

  const handlePageChange = (direction) => {
    setPage((prevPage) =>
      Math.max(1, Math.min(prevPage + direction, totalPages))
    );
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        {/* <h3 className="text-xl font-semibold text-gray-700">
          Users: ({users.length})
        </h3> */}
        <input
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(1); // Reset to the first page when filtering
          }}
          type="text"
          placeholder="Search users..."
          className="w-full h-12 px-4 rounded-md border border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600 text-gray-700"
        />
      </div>

      {loading ? (
        <div className="text-center text-gray-600">Loading users...</div>
      ) : users.length > 0 ? (
        <div>
          {/* User Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6 place-items-center">
            {users.map((user) => (
              <DisplayUser
                key={user._id}
                fullName={`${user.firstName} ${user.lastName}`}
                id={user._id}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-center items-center mt-6">
            <button
              onClick={() => handlePageChange(-1)}
              disabled={page === 1}
              className={`px-4 py-2 mr-2 rounded-md ${
                page === 1
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-sky-600 text-white hover:bg-sky-500"
              }`}
            >
              Previous
            </button>
            <span className="mx-2 text-gray-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(1)}
              disabled={page === totalPages}
              className={`px-4 py-2 ml-2 rounded-md ${
                page === totalPages
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-sky-600 text-white hover:bg-sky-500"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-600">No users found.</div>
      )}
    </div>
  );
};
