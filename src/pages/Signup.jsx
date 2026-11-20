import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, getErrorMessage, getFieldErrors } from "../lib/api";
import { formatAmount } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { AuthLayout } from "../components/AuthLayout";
import { Button, Field, Notice } from "../components/ui";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const Signup = () => {
  const { signIn } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ firstName: "", lastName: "", username: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((x) => ({ ...x, [key]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.firstName.trim()) next.firstName = "Required";
    if (!form.lastName.trim()) next.lastName = "Required";
    if (!EMAIL.test(form.username.trim())) next.username = "Enter a valid email address";
    if (form.password.length < 6) next.password = "Use at least 6 characters";
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
      const { data } = await api.post("/user/signup", {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        username: form.username.trim(),
        password: form.password,
      });
      if (!data?.token) throw new Error("No token in response");
      signIn(data.token, data.user || { firstName: data.firstName });
      toast.success(
        data.balance
          ? `Account opened. ₹${formatAmount(data.balance)} has landed in your wallet.`
          : "Account opened."
      );
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err, "Couldn't create your account. Please try again."));
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Open an account"
      intro="Takes about twenty seconds. You'll start with some play money to send around."
      footer={
        <>
          Already have one?{" "}
          <Link to="/signin" className="font-medium text-ink underline underline-offset-4 hover:text-ledger">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {formError && <Notice tone="error">{formError}</Notice>}
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="First name"
            autoComplete="given-name"
            autoFocus
            value={form.firstName}
            onChange={set("firstName")}
            error={errors.firstName}
            maxLength={50}
          />
          <Field
            label="Last name"
            autoComplete="family-name"
            value={form.lastName}
            onChange={set("lastName")}
            error={errors.lastName}
            maxLength={50}
          />
        </div>
        <Field
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={form.username}
          onChange={set("username")}
          error={errors.username}
          placeholder="you@example.com"
        />
        <Field
          label="Password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={set("password")}
          error={errors.password}
          hint="At least 6 characters."
        />
        <Button type="submit" size="lg" className="w-full" loading={submitting} loadingText="Opening your account">
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
};
