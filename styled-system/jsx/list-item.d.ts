/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { ListItemProperties } from '../patterns/list-item';
import type { HTMLStyledProps } from '../types/jsx';
import type { DistributiveOmit } from '../types/system-types';

export interface ListItemProps extends ListItemProperties, DistributiveOmit<HTMLStyledProps<'div'>, keyof ListItemProperties > {}

/**
 * A list item with hover accent border
 */
export declare const ListItem: FunctionComponent<ListItemProps>