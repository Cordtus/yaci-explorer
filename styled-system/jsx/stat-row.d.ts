/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { StatRowProperties } from '../patterns/stat-row';
import type { HTMLStyledProps } from '../types/jsx';
import type { DistributiveOmit } from '../types/system-types';

export interface StatRowProps extends StatRowProperties, DistributiveOmit<HTMLStyledProps<'div'>, keyof StatRowProperties > {}

/**
 * A compact stat display with label and value
 */
export declare const StatRow: FunctionComponent<StatRowProps>