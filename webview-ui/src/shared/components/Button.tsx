import React from "react";
import styles from "./Button.module.css";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  children,
  className,
  ...props
}) => {
  const variantClass = variant === "secondary" ? styles.secondary : styles.primary;
  const combinedClassName = `${styles.button} ${variantClass} ${className || ""}`;

  return (
    <button className={combinedClassName} {...props}>
      {children}
    </button>
  );
};

