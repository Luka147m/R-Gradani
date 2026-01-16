import type { LucideIcon } from "lucide-react";
import type { IconTextProps } from "../types/components/IconTextProps";
import { useState } from "react";

interface WithSelectableIconProps extends Omit<IconTextProps, "icon"> {
  icon: LucideIcon;
  selectedIcon: LucideIcon;
  initialSelected?: boolean; // optional initial state
}

const withSelectableIcon = <P extends object>(
  WrappedComponent: React.ComponentType<P & IconTextProps>
) => {
  const Component: React.FC<P & WithSelectableIconProps> = ({
    icon: defaultIcon,
    selectedIcon,
    initialSelected = false,
    ...rest
  }) => {
    const [selected, setSelected] = useState(initialSelected);

    const toggleSelected = () => setSelected((prev) => !prev);

    const iconToUse = selected ? selectedIcon : defaultIcon;

    return (
      <div
        onClick={toggleSelected}
        style={{ display: "inline-block", cursor: "pointer" }}
      >
        <WrappedComponent {...(rest as P & IconTextProps)} icon={iconToUse} />
      </div>
    );
  };

  return Component;
};

export default withSelectableIcon;
