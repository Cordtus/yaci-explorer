/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index';
import type { Properties } from '../types/csstype';
import type { SystemProperties } from '../types/style-props';
import type { DistributiveOmit } from '../types/system-types';
import type { Tokens } from '../tokens/index';

export interface StatRowProperties {
   
}

interface StatRowStyles extends StatRowProperties, DistributiveOmit<SystemStyleObject, keyof StatRowProperties > {}

interface StatRowPatternFn {
  (styles?: StatRowStyles): string
  raw: (styles?: StatRowStyles) => SystemStyleObject
}

/**
 * A compact stat display with label and value
 */
export declare const statRow: StatRowPatternFn;
