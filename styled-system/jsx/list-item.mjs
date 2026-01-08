import { createElement, forwardRef } from 'react'

import { splitProps } from '../helpers.mjs';
import { getListItemStyle } from '../patterns/list-item.mjs';
import { styled } from './factory.mjs';

export const ListItem = /* @__PURE__ */ forwardRef(function ListItem(props, ref) {
  const [patternProps, restProps] = splitProps(props, [])

const styleProps = getListItemStyle(patternProps)
const mergedProps = { ref, ...styleProps, ...restProps }

return createElement(styled.div, mergedProps)
  })