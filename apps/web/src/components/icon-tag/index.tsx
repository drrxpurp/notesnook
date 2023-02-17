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

import { Theme } from "@notesnook/theme";
import { Flex, Text } from "@theme-ui/components";
import { ThemeUICSSObject } from "@theme-ui/core";
import { Icon } from "../icons";

type IconTagProps = {
  text: string;
  title?: string;
  icon: Icon;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  styles?: {
    icon?: ThemeUICSSObject & { color: keyof Theme["colors"] };
    container?: ThemeUICSSObject;
    text?: ThemeUICSSObject;
  };
  testId?: string;
  highlight?: boolean;
};

function IconTag(props: IconTagProps) {
  const { icon: Icon, text, title, onClick, styles, testId, highlight } = props;

  return (
    <Flex
      data-test-id={testId}
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick(e);
        }
      }}
      title={title || text}
      sx={{
        borderRadius: "default",
        border: "1px solid",
        borderColor: "border",
        lineHeight: "initial",
        ":hover": onClick
          ? {
              bg: "hover",
              filter: "brightness(95%)"
            }
          : {},
        maxWidth: "100%",
        px: 1,
        // mr: 1,
        cursor: onClick ? "pointer" : "default",
        overflow: "hidden",
        ...styles?.container,
        flexShrink: 0,
        alignItems: "center",
        justifyContent: "center"
      }}
      bg="bgSecondary"
      py="2px"
    >
      <Icon
        size={11}
        // color={styles?.icon?.color || (highlight ? "primary" : "icon")}
        sx={{ ...styles?.icon, flexShrink: 0 }}
      />
      <Text
        variant="body"
        sx={{
          fontSize: 11,
          ml: "2px",
          p: 0,
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          overflow: "hidden",
          color: highlight ? "primary" : "text",
          ...styles?.text
        }}
      >
        {text}
      </Text>
    </Flex>
  );
}
export default IconTag;
