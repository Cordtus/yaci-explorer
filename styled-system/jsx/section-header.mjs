import { createElement, forwardRef } from 'react'

import { splitProps } from '../helpers.mjs';
import { getSectionHeaderStyle } from '../patterns/section-header.mjs';
import { styled } from './factory.mjs';

export const SectionHeader = /* @__PURE__ */ forwardRef(function SectionHeader(props, ref) {
  const [patternProps, restProps] = splitProps(props, [])

const styleProps = getSectionHeaderStyle(patternProps)
const mergedProps = { ref, ...styleProps, ...restProps }

return createElement(styled.div, mergedProps)
  })