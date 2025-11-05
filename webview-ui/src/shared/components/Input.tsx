import React from "react";
import styles from "./Input.module.css";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  hint,
  className,
  ...props
}) => {
  return (
    <div className={styles.container}>
      {label && <label className={styles.label}>{label}</label>}
      <input className={`${styles.input} ${className || ""}`} {...props} />
      {hint && <div className={styles.hint}>{hint}</div>}
    </div>
  );
};

