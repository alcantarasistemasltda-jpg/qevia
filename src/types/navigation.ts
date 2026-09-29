import type { LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
  badge?: string | number;
  disabled?: boolean;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}
