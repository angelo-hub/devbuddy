import React from "react";
import styles from "./TextArea.module.css";

interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  hint,
  className,
  ...props
}) => {
  return (
    <div className={styles.container}>
      {label && <label className={styles.label}>{label}</label>}
      <textarea className={`${styles.textarea} ${className || ""}`} {...props} />
      {hint && <div className={styles.hint}>{hint}</div>}
    </div>
  );
};

