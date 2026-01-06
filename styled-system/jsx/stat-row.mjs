import { createElement, forwardRef } from 'react'

import { splitProps } from '../helpers.mjs';
import { getStatRowStyle } from '../patterns/stat-row.mjs';
import { styled } from './factory.mjs';

export const StatRow = /* @__PURE__ */ forwardRef(function StatRow(props, ref) {
  const [patternProps, restProps] = splitProps(props, [])

const styleProps = getStatRowStyle(patternProps)
const mergedProps = { ref, ...styleProps, ...restProps }

return createElement(styled.div, mergedProps)
  })