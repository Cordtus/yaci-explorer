/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index';
import type { Properties } from '../types/csstype';
import type { SystemProperties } from '../types/style-props';
import type { DistributiveOmit } from '../types/system-types';
import type { Tokens } from '../tokens/index';

export interface SectionHeaderProperties {
   
}

interface SectionHeaderStyles extends SectionHeaderProperties, DistributiveOmit<SystemStyleObject, keyof SectionHeaderProperties > {}

interface SectionHeaderPatternFn {
  (styles?: SectionHeaderStyles): string
  raw: (styles?: SectionHeaderStyles) => SystemStyleObject
}

/**
 * A section header with space-between layout
 */
export declare const sectionHeader: SectionHeaderPatternFn;
