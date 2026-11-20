import { useEffect, useState } from "react";
import { api, getErrorMessage, getFieldErrors } from "../lib/api";
import { fullName } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useShell } from "../components/AppShell";
import { Avatar, Button, Field, Notice, SectionHeading } from "../components/ui";

export const UpdateDetails = () => {
  const { user, updateUser } = useAuth();
  const { account, loadAccount } = useShell();
  const toast = useToast();

  const current = account.data || user || {};
  const [form, setForm] = useState({
    firstName: current.firstName || "",
    lastName: current.lastName || "",
    newPassword: "",
    currentPassword: "",
  });
  const [errors, setErrors] = useState({});

  // Older sessions have no stored name; fill the form once the account loads.
  const loadedFirst = account.data?.firstName;
  const loadedLast = account.data?.lastName;
  useEffect(() => {
    setForm((f) => ({
      ...f,
      firstName: f.firstName || loadedFirst || "",
      lastName: f.lastName || loadedLast || "",
    }));
  }, [loadedFirst, loadedLast]);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((x) => ({ ...x, [key]: undefined }));
  };

  const changes = {};
  if (form.firstName.trim() && form.firstName.trim() !== (current.firstName || "")) changes.firstName = form.firstName.trim();
  if (form.lastName.trim() && form.lastName.trim() !== (current.lastName || "")) changes.lastName = form.lastName.trim();
  if (form.newPassword) changes.newPassword = form.newPassword;
  const dirty = Object.keys(changes).length > 0;

  async function onSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setFormError("");

    const next = {};
    if (!form.firstName.trim()) next.firstName = "First name can't be empty";
    if (!form.lastName.trim()) next.lastName = "Last name can't be empty";
    if (form.newPassword && form.newPassword.length < 6) next.newPassword = "Use at least 6 characters";
    if (!form.currentPassword) next.currentPassword = "Enter your current password to confirm";
    if (!dirty) next.form = "Nothing has changed yet.";
    if (Object.keys(next).length) {
      setErrors(next);
      if (next.form && Object.keys(next).length === 1) setFormError(next.form);
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.put("/user/user-update", {
        ...changes,
        currentPassword: form.currentPassword,
      });
      if (data?.user) updateUser(data.user);
      loadAccount();
      setForm((f) => ({ ...f, newPassword: "", currentPassword: "" }));
      setErrors({});
      toast.success(changes.newPassword ? "Profile and password updated." : "Profile updated.");
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err, "Couldn't save your changes."));
    } finally {
      setSubmitting(false);
    }
  }

  const displayName = fullName({ firstName: form.firstName || current.firstName, lastName: form.lastName || current.lastName });

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-4">
        <Avatar name={displayName} size="lg" tone="ink" />
        <div className="min-w-0">
          <h1 className="truncate font-serif text-[32px] leading-tight tracking-tight">{displayName}</h1>
          {current.username && <p className="truncate text-[13px] text-ink-muted">{current.username}</p>}
        </div>
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-10 space-y-10">
        {formError && <Notice tone={errors.form ? "info" : "error"}>{formError}</Notice>}

        <fieldset className="space-y-5">
          <SectionHeading>Your name</SectionHeading>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="First name"
              autoComplete="given-name"
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
        </fieldset>

        <fieldset className="space-y-5">
          <SectionHeading>Password</SectionHeading>
          <Field
            label="New password"
            type="password"
            autoComplete="new-password"
            value={form.newPassword}
            onChange={set("newPassword")}
            error={errors.newPassword}
            hint="Leave blank to keep your current password."
          />
        </fieldset>

        <div className="rounded border border-rule-strong bg-paper-raised p-5">
          <Field
            label="Current password"
            type="password"
            autoComplete="current-password"
            value={form.currentPassword}
            onChange={set("currentPassword")}
            error={errors.currentPassword}
            hint="Needed to confirm any change."
          />
          <div className="mt-5 flex items-center gap-4">
            <Button type="submit" loading={submitting} loadingText="Saving" disabled={!dirty && !submitting}>
              Save changes
            </Button>
            {!dirty && <span className="text-[13px] text-ink-muted">No changes yet</span>}
          </div>
        </div>
      </form>
    </div>
  );
};
