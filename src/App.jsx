import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Signup } from "./pages/Signup";
import { Signin } from "./pages/Signin";
import { Dashboard } from "./pages/Dashboard";
import { SendMoney } from "./pages/SendMoney";
import { Me } from "./components/Me";
import { UpdateDetails } from "./pages/UpdateDetails";
import { RequestMoney } from "./pages/RequestMoney";

function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Me rt={"dashboard"} />} />
          <Route
            path="/signup"
            element={
              localStorage.getItem("token") ? (
                <Navigate to={"/dashboard"} />
              ) : (
                <Signup />
              )
            }
          />
          <Route
            path="/signin"
            element={
              localStorage.getItem("token") ? (
                <Navigate to={"/dashboard"} />
              ) : (
                <Signin />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              localStorage.getItem("token") ? (
                <Dashboard />
              ) : (
                <Navigate to={"/signin"} />
              )
            }
          />
          <Route
            path="/send"
            element={
              localStorage.getItem("token") ? (
                <SendMoney />
              ) : (
                <Navigate to={"/signin"} />
              )
            }
          />
          <Route
            path="/update-user"
            element={
              localStorage.getItem("token") ? (
                <UpdateDetails />
              ) : (
                <Navigate to={"/signin"} />
              )
            }
          />
          <Route
            path="/request"
            element={
              localStorage.getItem("token") ? (
                <RequestMoney />
              ) : (
                <Navigate to={"/signin"} />
              )
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
