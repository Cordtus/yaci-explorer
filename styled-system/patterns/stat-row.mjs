import { getPatternStyles, patternFns } from '../helpers.mjs';
import { css } from '../css/index.mjs';

const statRowConfig = {
transform() {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    py: "2",
    px: "3",
    borderRadius: "md",
    border: "1px solid",
    borderColor: "border.default",
    bg: "bg.subtle"
  };
}}

export const getStatRowStyle = (styles = {}) => {
  const _styles = getPatternStyles(statRowConfig, styles)
  return statRowConfig.transform(_styles, patternFns)
}

export const statRow = (styles) => css(getStatRowStyle(styles))
statRow.raw = getStatRowStyle