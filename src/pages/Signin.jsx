import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api, getErrorMessage, getFieldErrors } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { AuthLayout } from "../components/AuthLayout";
import { Button, Field, Notice } from "../components/ui";

export const Signin = () => {
  const { signIn } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((x) => ({ ...x, [key]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.username.trim()) next.username = "Enter your email";
    if (!form.password) next.password = "Enter your password";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  async function onSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setFormError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const { data } = await api.post(
        "/user/signin",
        { username: form.username.trim(), password: form.password },
        { retry: true } // signing in twice is harmless, so retry while the server wakes
      );
      if (!data?.token) throw new Error("No token in response");
      signIn(data.token, data.user || { firstName: data.firstName });
      toast.success(`Welcome back, ${data.firstName || "friend"}.`);
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err, "Couldn't sign you in. Please try again."));
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      intro="Good to see you again."
      footer={
        <>
          New here?{" "}
          <Link to="/signup" className="font-medium text-ink underline underline-offset-4 hover:text-ledger">
            Open an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {formError && <Notice tone="error">{formError}</Notice>}
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoFocus
          value={form.username}
          onChange={set("username")}
          error={errors.username}
          placeholder="you@example.com"
        />
        <Field
          label="Password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={set("password")}
          error={errors.password}
        />
        <Button type="submit" size="lg" className="w-full" loading={submitting} loadingText="Signing in">
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
};
