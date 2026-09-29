import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, CircleAlert } from "lucide-react";
import "./InputWithLabel.css";

// Text field with a floating label, optional leading icon, password reveal and animated error.
const InputWithLabel = ({
  type = "text",
  id,
  name,
  label,
  required,
  value,
  onChange,
  onFocus,
  inputRef,
  icon: Icon,
  error,
  hint,
  autoComplete,
  disabled,
}) => {
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && revealed ? "text" : type;
  const messageId = `${id}-message`;
  const message = error || hint;

  return (
    <div className={`field ${error ? "field--error" : ""} ${Icon ? "field--with-icon" : ""}`}>
      <motion.div
        className="field__control"
        animate={error ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
      >
        {Icon && <Icon className="field__icon" size={18} aria-hidden="true" />}
        <input
          ref={inputRef}
          type={inputType}
          id={id}
          name={name}
          required={required}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          autoComplete={autoComplete}
          disabled={disabled}
          placeholder=" "
          aria-invalid={Boolean(error)}
          aria-describedby={message ? messageId : undefined}
        />
        <label htmlFor={id}>{label}</label>
        {isPassword && (
          <button
            type="button"
            className="field__reveal"
            onClick={() => setRevealed((r) => !r)}
            aria-label={revealed ? "Hide password" : "Show password"}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={revealed ? "hide" : "show"}
                initial={{ opacity: 0, scale: 0.6, rotate: -30 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.6, rotate: 30 }}
                transition={{ duration: 0.18 }}
              >
                {revealed ? <EyeOff size={18} /> : <Eye size={18} />}
              </motion.span>
            </AnimatePresence>
          </button>
        )}
      </motion.div>
      <AnimatePresence initial={false}>
        {message && (
          <motion.p
            id={messageId}
            className={error ? "field__error" : "field__hint"}
            initial={{ opacity: 0, height: 0, y: -4 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {error && <CircleAlert size={15} aria-hidden="true" />}
            {message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InputWithLabel;
