/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index';
import type { Properties } from '../types/csstype';
import type { SystemProperties } from '../types/style-props';
import type { DistributiveOmit } from '../types/system-types';
import type { Tokens } from '../tokens/index';

export interface ListItemProperties {
   
}

interface ListItemStyles extends ListItemProperties, DistributiveOmit<SystemStyleObject, keyof ListItemProperties > {}

interface ListItemPatternFn {
  (styles?: ListItemStyles): string
  raw: (styles?: ListItemStyles) => SystemStyleObject
}

/**
 * A list item with hover accent border
 */
export declare const listItem: ListItemPatternFn;
