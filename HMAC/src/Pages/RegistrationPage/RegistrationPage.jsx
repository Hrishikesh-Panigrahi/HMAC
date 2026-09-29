import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Mail, ShieldCheck, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import AuthLayout from "../../Components/AuthLayout/AuthLayout";
import InputWithLabel from "../../Components/InputWithLabel/InputWithLabel";
import "./RegistrationPage.css";

const STRENGTH_LABELS = ["Too short", "Weak", "Fair", "Good", "Strong"];

const passwordStrength = (password) => {
  if (password.length < 8) return 0;
  let score = 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RegistrationPage = () => {
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});

  const update = (field) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((errs) => ({ ...errs, [field]: undefined }));
  };

  const strength = passwordStrength(form.password);

  const validate = () => {
    const next = {};
    if (!form.fullName.trim()) next.fullName = "Enter your full name.";
    if (!EMAIL_PATTERN.test(form.email)) next.email = "Enter a valid email address.";
    if (form.password.length < 8) next.password = "Use at least 8 characters.";
    if (form.confirmPassword !== form.password) next.confirmPassword = "Passwords don't match.";
    return next;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    // The API has no sign-up endpoint yet, so accounts are created by an admin.
    toast.info("Self sign-up isn't available yet", {
      description: "Ask your professor or an admin to create your account, then sign in.",
    });
  };

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Join your class to start submitting assignments."
      footer={
        <>
          Already registered? <Link to="/">Sign in</Link>
        </>
      }
    >
      <form className="auth__form" onSubmit={handleSubmit} noValidate>
        <InputWithLabel
          type="text"
          id="fullName"
          name="fullName"
          label="Full name"
          icon={UserRound}
          autoComplete="name"
          required
          value={form.fullName}
          onChange={update("fullName")}
          error={errors.fullName}
        />

        <InputWithLabel
          type="email"
          id="email"
          name="email"
          label="Email"
          icon={Mail}
          autoComplete="email"
          required
          value={form.email}
          onChange={update("email")}
          error={errors.email}
        />

        <div className="register__password">
          <InputWithLabel
            type="password"
            id="password"
            name="password"
            label="Password"
            icon={Lock}
            autoComplete="new-password"
            required
            value={form.password}
            onChange={update("password")}
            error={errors.password}
          />
          {form.password && (
            <motion.div
              className={`strength strength--${strength}`}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              aria-live="polite"
            >
              <div className="strength__bars">
                {[1, 2, 3, 4].map((level) => (
                  <span key={level} className={level <= strength ? "is-on" : ""} />
                ))}
              </div>
              <span className="strength__label">{STRENGTH_LABELS[strength]}</span>
            </motion.div>
          )}
        </div>

        <InputWithLabel
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm password"
          icon={ShieldCheck}
          autoComplete="new-password"
          required
          value={form.confirmPassword}
          onChange={update("confirmPassword")}
          error={errors.confirmPassword}
        />

        <button className="btn btn-primary btn-lg btn-block">Create account</button>
      </form>
    </AuthLayout>
  );
};

export default RegistrationPage;
