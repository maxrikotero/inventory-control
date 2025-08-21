import * as React from "react";
import {
  Label as RadixLabel,
  LabelProps as RadixLabelProps,
} from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

export type LabelProps = RadixLabelProps;

const Label = React.forwardRef<React.ElementRef<typeof RadixLabel>, LabelProps>(
  ({ className, ...props }, ref) => (
    <RadixLabel
      ref={ref}
      className={cn("text-sm font-medium leading-none", className)}
      {...props}
    />
  )
);
Label.displayName = "Label";

export { Label };
