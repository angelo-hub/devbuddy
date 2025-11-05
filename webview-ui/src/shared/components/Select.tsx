import React from "react";
import styles from "./Select.module.css";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  options?: Array<{ value: string; label: string }>;
  children?: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
  label,
  hint,
  options,
  children,
  className,
  ...props
}) => {
  return (
    <div className={styles.container}>
      {label && <label className={styles.label}>{label}</label>}
      <select className={`${styles.select} ${className || ""}`} {...props}>
        {options
          ? options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))
          : children}
      </select>
      {hint && <div className={styles.hint}>{hint}</div>}
    </div>
  );
};

