import * as React from "react";

import { cn } from "@/lib/utils";

function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn("form-control cursor-pointer", className)}
      {...props}
    />
  );
}

export { Select };
