import type { CSSProperties } from "@mui/material";
import type { LucideIcon } from "lucide-react";

export interface IconTextProps {
  icon: LucideIcon;
  text: string;
  iconRight?: boolean; // optional, default to left
  className?: string;
  style?: CSSProperties; // container style
  iconStyle?: CSSProperties; // style for icon only
  textStyle?: CSSProperties; // style for text only
  iconSize?: number; // optional, default size for icon
  selected?: boolean;
  fillColor?: string;
}
