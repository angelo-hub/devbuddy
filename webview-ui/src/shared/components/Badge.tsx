import React from "react";
import styles from "./Badge.module.css";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "status" | "priority";
  color?: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  color,
  className,
}) => {
  const variantClass = styles[variant] || styles.default;
  const style = color
    ? {
        backgroundColor: `${color}20`,
        color: color,
        borderColor: `${color}40`,
      }
    : {};

  return (
    <span className={`${styles.badge} ${variantClass} ${className || ""}`} style={style}>
      {children}
    </span>
  );
};

