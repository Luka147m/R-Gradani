import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import IconText from "../../components/IconText";
import { ExternalLink, Home, LayoutDashboard, MoveLeft, ChartBarStacked } from "lucide-react";
import { colors } from "../../style/global/colors";

import "../../style/Header.css";
import { usePathHistory } from "../../providers/PathHistoryProvider";

interface HeaderItemProps {
  selected: boolean;
}

const iconStyle = { fontWeight: "bold" };

const HomeItem: React.FC<HeaderItemProps> = ({ selected }) => (
  <IconText
    icon={Home}
    text="Početna stranica"
    selected={selected}
    fillColor={colors.primary}
    style={iconStyle}
    iconSize={22}
  ></IconText>
);

const ProfileItem: React.FC<HeaderItemProps> = ({ selected }) => (
  <IconText
    icon={LayoutDashboard}
    text="Korisnička stranica"
    selected={selected}
    fillColor={colors.secondary}
    style={iconStyle}
    iconSize={22}
  ></IconText>
);

const StatisticsItem: React.FC<HeaderItemProps> = ({ selected }) => (
  <IconText
    icon={ChartBarStacked}
    text="Statistika"
    selected={selected}
    fillColor={colors.stats}
    style={iconStyle}
    iconSize={22}
  ></IconText>
);

interface HeaderLink {
  path: string;
  component: React.FC<HeaderItemProps>;
  selected: boolean;
}

const Header: React.FC = () => {
  const { getLatestPath, popLatestPath } = usePathHistory();
  const latestPath = getLatestPath();

  const [headerItems, setHeaderItems] = useState<HeaderLink[]>([
    { path: "/", component: HomeItem, selected: false },
    { path: "/profile", component: ProfileItem, selected: false },
    { path: "/statistics", component: StatisticsItem, selected: false },
  ]);

  useEffect(() => {
    setHeaderItems((prevItems) =>
      prevItems.map((item) => ({
        ...item,
        selected: item.path === location.pathname,
      }))
    );
  }, [location.pathname]);

  return (
    <header className="header">
      <div className="first">
        {latestPath && (
          <Link
            to={latestPath}
            onClick={() => popLatestPath()}
            className="link"
          >
            <IconText
              icon={MoveLeft}
              text="Natrag"
              className="path_history"
              iconSize={20}
            ></IconText>
          </Link>
        )}
      </div>
      <div className="middle">
        <nav className="nav">
          {headerItems.map((item) => {
            const Component = item.component;
            return (
              <Link key={item.path} to={item.path} className="link">
                <Component selected={item.selected} />
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="last">
        <a href="https://r-gradani-backend.onrender.com/docs" className="link">
          <IconText
            icon={ExternalLink}
            text="API dokumentacija"
            iconSize={20}
          ></IconText>
        </a>
      </div>
    </header>
  );
};

export default Header;
