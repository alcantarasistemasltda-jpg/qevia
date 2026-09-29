import type { ReactNode } from "react";

export type StatusVariant = "default" | "success" | "warning" | "danger" | "info" | "neutral";
export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "gradient";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ComponentWithChildren {
  children?: ReactNode;
}

export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
}
