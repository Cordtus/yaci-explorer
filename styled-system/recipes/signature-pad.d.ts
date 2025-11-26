/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface SignaturePadVariant {
  
}

type SignaturePadVariantMap = {
  [key in keyof SignaturePadVariant]: Array<SignaturePadVariant[key]>
}

type SignaturePadSlot = "root" | "control" | "segment" | "segmentPath" | "guide" | "clearTrigger" | "label"

export type SignaturePadVariantProps = {
  [key in keyof SignaturePadVariant]?: ConditionalValue<SignaturePadVariant[key]> | undefined
}

export interface SignaturePadRecipe {
  __slot: SignaturePadSlot
  __type: SignaturePadVariantProps
  (props?: SignaturePadVariantProps): Pretty<Record<SignaturePadSlot, string>>
  raw: (props?: SignaturePadVariantProps) => SignaturePadVariantProps
  variantMap: SignaturePadVariantMap
  variantKeys: Array<keyof SignaturePadVariant>
  splitVariantProps<Props extends SignaturePadVariantProps>(props: Props): [SignaturePadVariantProps, Pretty<DistributiveOmit<Props, keyof SignaturePadVariantProps>>]
  getVariantProps: (props?: SignaturePadVariantProps) => SignaturePadVariantProps
}


export declare const signaturePad: SignaturePadRecipe