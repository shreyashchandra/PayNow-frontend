/* eslint-disable react/prop-types */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const Me = ({ rt }) => {
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/" + rt);
    } else {
      navigate("/signin");
    }
  }, [navigate, rt]);
  return <div>Me</div>;
};
