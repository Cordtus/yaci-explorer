import { getPatternStyles, patternFns } from '../helpers.mjs';
import { css } from '../css/index.mjs';

const sectionHeaderConfig = {
transform() {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    mb: "4"
  };
}}

export const getSectionHeaderStyle = (styles = {}) => {
  const _styles = getPatternStyles(sectionHeaderConfig, styles)
  return sectionHeaderConfig.transform(_styles, patternFns)
}

export const sectionHeader = (styles) => css(getSectionHeaderStyle(styles))
sectionHeader.raw = getSectionHeaderStyle