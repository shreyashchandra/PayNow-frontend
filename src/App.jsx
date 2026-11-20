import { useEffect } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ConnectionBanner } from "./components/ConnectionBanner";
import { AppShell } from "./components/AppShell";
import { warmUp } from "./lib/api";
import { Signup } from "./pages/Signup";
import { Signin } from "./pages/Signin";
import { Dashboard } from "./pages/Dashboard";
import { SendMoney } from "./pages/SendMoney";
import { RequestMoney } from "./pages/RequestMoney";
import { UpdateDetails } from "./pages/UpdateDetails";
import { NotFound } from "./pages/NotFound";
import { History } from "./pages/History";

function RequireAuth() {
  const { isAuthed } = useAuth();
  const location = useLocation();
  if (!isAuthed) {
    return <Navigate to="/signin" replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}

function GuestOnly() {
  const { isAuthed } = useAuth();
  return isAuthed ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

function Home() {
  const { isAuthed } = useAuth();
  return <Navigate to={isAuthed ? "/dashboard" : "/signin"} replace />;
}

function TitleSync() {
  const { pathname } = useLocation();
  useEffect(() => {
    const titles = {
      "/signin": "Sign in",
      "/signup": "Open an account",
      "/dashboard": "Overview",
      "/send": "Pay",
      "/request": "Request",
      "/history": "History",
      "/update-user": "Profile",
    };
    document.title = titles[pathname] ? `${titles[pathname]} · PayNow` : "PayNow";
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  // Start waking the (possibly sleeping) server as soon as the page opens.
  useEffect(() => {
    warmUp();
  }, []);

  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <TitleSync />
            <ConnectionBanner />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route element={<GuestOnly />}>
                <Route path="/signin" element={<Signin />} />
                <Route path="/signup" element={<Signup />} />
              </Route>
              <Route element={<RequireAuth />}>
                <Route element={<AppShell />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/send" element={<SendMoney />} />
                  <Route path="/request" element={<RequestMoney />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/update-user" element={<UpdateDetails />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
