import React from "react";
import type { IconTextProps } from "../../types/components/IconTextProps";

const IconText: React.FC<IconTextProps> = ({
  icon: Icon,
  text,
  iconRight = false,
  className = "",
  style = {},
  iconStyle = {},
  textStyle = {},
  iconSize = 16,
  selected = false,
  fillColor = "",
}) => {
  return (
    <span
      className={`icon-text ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        color: selected ? fillColor : undefined,
        textDecoration: selected ? "underline" : undefined,
        ...style,
      }}
    >
      {!iconRight && (
        <Icon
          size={iconSize}
          style={iconStyle}
          color={(selected && fillColor) || undefined}
        />
      )}
      <span style={textStyle}>{text}</span>
      {iconRight && (
        <Icon
          size={iconSize}
          style={iconStyle}
          color={(selected && fillColor) || undefined}
        />
      )}
    </span>
  );
};

export default IconText;
