import { getPatternStyles, patternFns } from '../helpers.mjs';
import { css } from '../css/index.mjs';

const listItemConfig = {
transform() {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    w: "full",
    py: "3",
    borderBottomWidth: "1px",
    borderColor: "border.default",
    transition: "all 0.2s",
    _hover: {
      borderLeftWidth: "2px",
      borderLeftColor: "accent.default",
      pl: "2",
      bg: "bg.accentSubtle"
    },
    _last: { borderBottomWidth: "0" }
  };
}}

export const getListItemStyle = (styles = {}) => {
  const _styles = getPatternStyles(listItemConfig, styles)
  return listItemConfig.transform(_styles, patternFns)
}

export const listItem = (styles) => css(getListItemStyle(styles))
listItem.raw = getListItemStyle