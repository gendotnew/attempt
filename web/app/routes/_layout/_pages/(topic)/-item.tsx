import * as React from "react"
import { LaIcon } from "@/components/custom/la-icon"
import { cn, ensureUrlProtocol } from "@/lib/utils"
import { Link as LinkSchema } from "@/lib/schema"

interface LinkItemProps extends React.ComponentPropsWithoutRef<"div"> {
  link: LinkSchema
  isActive: boolean
  index: number
  setActiveIndex: (index: number) => void
}

export const LinkItem = React.forwardRef<HTMLDivElement, LinkItemProps>(
  ({ link, isActive, index, setActiveIndex, className, ...props }, ref) => (
    <div
      ref={ref}
      tabIndex={0}
      onClick={() => setActiveIndex(index)}
      className={cn(
        "relative flex h-14 items-center outline-none xl:h-11",
        isActive ? "bg-muted-foreground/10" : "hover:bg-muted/50",
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 grow items-center gap-3 px-6 max-lg:px-4">
        <LaIcon
          name="Link"
          aria-hidden="true"
          className="shrink-0 text-muted-foreground"
        />
        <a
          href={ensureUrlProtocol(link.url)}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 flex-1 rounded-sm focus-visible:outline focus-visible:outline-2"
        >
          <span
            className={cn(
              "line-clamp-1 text-sm font-medium",
              isActive && "font-bold",
            )}
          >
            {link.title}
          </span>
          <span className="line-clamp-1 text-xs text-muted-foreground">
            {link.url}
          </span>
        </a>
      </div>
    </div>
  ),
)
LinkItem.displayName = "LinkItem"
