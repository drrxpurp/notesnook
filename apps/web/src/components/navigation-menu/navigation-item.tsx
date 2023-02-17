/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { Button, Flex, Text } from "@theme-ui/components";
import { useStore as useAppStore } from "../../stores/app-store";
import { useMenuTrigger } from "../../hooks/use-menu";
import useMobile from "../../hooks/use-mobile";
import { PropsWithChildren } from "react";
import { Icon, Shortcut } from "../icons";
import { SchemeColors } from "@notesnook/theme/dist/theme/colorscheme";

type NavigationItemProps = {
  icon: Icon;
  color?: SchemeColors;
  title: string;
  isTablet?: boolean;
  isLoading?: boolean;
  isShortcut?: boolean;
  tag?: string;
  selected?: boolean;
  onClick?: () => void;
  // TODO: add proper typings here
  menuItems?: any[];
};

function NavigationItem(props: PropsWithChildren<NavigationItemProps>) {
  const {
    icon: Icon,
    color,
    title,
    isLoading,
    isShortcut,
    tag,
    children,
    isTablet,
    selected,
    onClick,
    menuItems
  } = props;
  const toggleSideMenu = useAppStore((store) => store.toggleSideMenu);
  const { openMenu } = useMenuTrigger();
  const isMobile = useMobile();

  return (
    <Flex
      bg={selected ? "shade" : "transparent"}
      sx={{
        borderRadius: "default",
        mx: 1,
        mt: isTablet ? 1 : "3px",
        alignItems: "center",
        position: "relative",
        ":first-of-type": { mt: 1 },
        ":last-of-type": { mb: 1 },
        ":hover:not(:disabled)": {
          bg: "hover",
          filter: "brightness(100%)"
        }
      }}
    >
      <Button
        data-test-id={`navigation-item`}
        bg={"transparent"}
        sx={{
          px: 2,
          flex: 1,
          alignItems: "center",
          justifyContent: isTablet ? "center" : "flex-start",
          display: "flex"
        }}
        title={title}
        onContextMenu={(e) => {
          if (!menuItems) return;
          e.preventDefault();
          openMenu(menuItems);
        }}
        onClick={() => {
          if (isMobile) toggleSideMenu(false);
          if (onClick) onClick();
        }}
      >
        <Icon
          size={isTablet ? 16 : 15}
          color={color || (selected ? "accent" : "icon")}
          rotate={isLoading}
        />
        {isShortcut && (
          <Shortcut
            size={8}
            sx={{ position: "absolute", bottom: "8px", left: "6px" }}
            color={color || "icon"}
            data-test-id="shortcut"
          />
        )}

        <Text
          variant="body"
          sx={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontWeight: selected ? "bold" : "normal",
            fontSize: "subtitle",
            display: isTablet ? "none" : "block"
          }}
          ml={1}
          data-test-id="title"
        >
          {title}
          {tag && (
            <Text
              variant="subBody"
              as="span"
              sx={{
                bg: "accent",
                color: "white",
                ml: 1,
                px: "small",
                borderRadius: "default"
              }}
            >
              {tag}
            </Text>
          )}
        </Text>
      </Button>
      {children}
    </Flex>
  );
}
export default NavigationItem;
