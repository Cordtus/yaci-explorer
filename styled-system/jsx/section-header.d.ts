/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { SectionHeaderProperties } from '../patterns/section-header';
import type { HTMLStyledProps } from '../types/jsx';
import type { DistributiveOmit } from '../types/system-types';

export interface SectionHeaderProps extends SectionHeaderProperties, DistributiveOmit<HTMLStyledProps<'div'>, keyof SectionHeaderProperties > {}

/**
 * A section header with space-between layout
 */
export declare const SectionHeader: FunctionComponent<SectionHeaderProps>