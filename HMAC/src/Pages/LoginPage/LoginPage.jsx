import { useState } from "react";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CircleAlert, LoaderCircle, Lock, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import AuthLayout from "../../Components/AuthLayout/AuthLayout";
import InputWithLabel from "../../Components/InputWithLabel/InputWithLabel";
import "./LoginPage.css";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const user = {
      email: email,
      password: password,
    };

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/v1/login/",
        user,
        { withCredentials: true }
      );

      if (response.status === 200) {
        const data = response.data;
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);

        toast.success("Signed in", { description: "Welcome back." });

        if (data.is_staff == true) {
          navigate("/Professor");
        } else {
          navigate("/Student");
        }
        return;
      }
      setError("Sign-in failed. Please try again.");
    } catch (err) {
      if (err.response) {
        setError("That email and password don't match an active account.");
      } else {
        setError("Couldn't reach the server. Check your connection and try again.");
      }
    }
    setLoading(false);
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to upload or review assignments."
      footer={
        <>
          Not registered? <Link to="/register">Create an account</Link>
        </>
      }
    >
      <form className="auth__form" onSubmit={handleLogin}>
        <AnimatePresence initial={false}>
          {error && (
            <motion.div
              className="auth__alert"
              role="alert"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <CircleAlert size={16} />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <InputWithLabel
          type="email"
          id="email"
          name="email"
          label="Email"
          icon={Mail}
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <InputWithLabel
          type="password"
          id="password"
          name="password"
          label="Password"
          icon={Lock}
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="btn btn-primary btn-lg btn-block login__submit" disabled={loading}>
          <AnimatePresence mode="wait" initial={false}>
            {loading ? (
              <motion.span key="loading" className="login__submit-inner" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <LoaderCircle size={18} className="spin" />
                Signing in…
              </motion.span>
            ) : (
              <motion.span key="idle" className="login__submit-inner" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                Sign in
                <ArrowRight size={18} className="login__arrow" />
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
