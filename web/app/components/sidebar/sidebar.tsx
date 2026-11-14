import * as React from "react"
import { useMedia } from "@/hooks/use-media"
import { useAtom } from "jotai"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { isCollapseAtom } from "@/store/sidebar"
import { LaIcon } from "@/components/custom/la-icon"
import { Link, useLocation } from "@tanstack/react-router"

interface SidebarItemProps {
  label: string
  url: string
  icon?: React.ReactNode
  onClick?: () => void
  children?: React.ReactNode
}

const useSidebarCollapse = (
  isTablet: boolean,
): [boolean, React.Dispatch<React.SetStateAction<boolean>>] => {
  const [isCollapsed, setIsCollapsed] = useAtom(isCollapseAtom)
  const location = useLocation()

  React.useEffect(() => {
    if (isTablet) setIsCollapsed(true)
  }, [location.pathname, setIsCollapsed, isTablet])

  React.useEffect(() => {
    setIsCollapsed(isTablet)
  }, [isTablet, setIsCollapsed])

  return [isCollapsed, setIsCollapsed]
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  label,
  url,
  icon,
  onClick,
  children,
}) => {
  const { pathname } = useLocation()
  const isActive = pathname === url

  return (
    <div
      className={cn(
        "group relative my-0.5 rounded-md",
        isActive ? "bg-secondary/80" : "hover:bg-secondary/40",
      )}
    >
      <Link
        className="flex h-8 grow items-center truncate rounded-md pl-1.5 pr-1 text-sm font-medium text-secondary-foreground"
        to={url}
        onClick={onClick}
      >
        {icon && (
          <span
            className={cn(
              "mr-2 size-4 text-primary/60 group-hover:text-primary",
              { "text-primary": isActive },
            )}
          >
            {icon}
          </span>
        )}
        <span>{label}</span>
        {children}
      </Link>
    </div>
  )
}

SidebarItem.displayName = "SidebarItem"

const LogoAndSearch: React.FC = () => {
  const { pathname } = useLocation()

  return (
    <div className="px-3">
      <div className="mt-2 flex h-10 max-w-full items-center">
        <Link to="/" className="px-2">
          <img src="/logo.png" alt="Learn Anything" className="size-7" />
        </Link>
        <div className="flex min-w-2 grow flex-row" />
        <Link
          to={pathname === "/search" ? "/" : "/search"}
          className={cn(
            buttonVariants({ size: "sm", variant: "secondary" }),
            "flex w-20 items-center justify-start py-4 pl-2 text-primary/60",
          )}
          activeProps={{
            className: "text-md font-medium",
          }}
          aria-label="Search"
        >
          {pathname === "/search" ? (
            "← Back"
          ) : (
            <LaIcon name="Search" className="size-4" />
          )}
        </Link>
      </div>
    </div>
  )
}

LogoAndSearch.displayName = "LogoAndSearch"

const SidebarContent: React.FC = () => {
  return (
    <nav className="relative flex h-full w-full shrink-0 flex-col bg-[var(--body-background)]">
      <div>
        <LogoAndSearch />
        <a
          href="/blog/"
          className="mx-4 mt-2 flex items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-secondary/40 hover:text-foreground focus-visible:outline focus-visible:outline-2"
        >
          <LaIcon name="BookOpen" aria-hidden="true" />
          Blog
        </a>
      </div>
      <div className="relative mt-1.5 flex grow flex-col overflow-y-auto rounded-md px-3 outline-none">
        <SidebarItem
          label="Explore topics"
          url="/search"
          icon={<LaIcon name="Compass" />}
        />
      </div>
      <a
        href="https://github.com/gendotnew/attempt"
        className="mx-4 mb-4 flex items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <LaIcon name="Github" aria-hidden="true" />
        Source code
      </a>
    </nav>
  )
}

SidebarContent.displayName = "SidebarContent"

const Sidebar: React.FC = () => {
  const isTablet = useMedia("(max-width: 1024px)")
  const [isCollapsed, setIsCollapsed] = useSidebarCollapse(isTablet)

  const sidebarClasses = cn(
    "h-full overflow-hidden transition-all duration-300 ease-in-out",
    isCollapsed ? "w-0" : "w-auto min-w-56",
  )

  const sidebarInnerClasses = cn(
    "h-full w-60 min-w-60 transition-transform duration-300 ease-in-out",
    isCollapsed ? "-translate-x-full" : "translate-x-0",
  )

  if (isTablet) {
    return (
      <>
        <div
          className={cn(
            "fixed inset-0 z-30 bg-black/40 transition-opacity duration-300",
            isCollapsed ? "pointer-events-none opacity-0" : "opacity-100",
          )}
          onClick={() => setIsCollapsed(true)}
        />
        <div
          className={cn(
            "fixed left-0 top-0 z-40 h-full",
            sidebarClasses,
            !isCollapsed &&
              "shadow-[4px_0px_16px_rgba(0,0,0,0.1)] transition-all",
          )}
        >
          <div
            className={cn(sidebarInnerClasses, "border-r border-r-primary/5")}
          >
            <SidebarContent />
          </div>
        </div>
      </>
    )
  }

  return (
    <div className={sidebarClasses}>
      <div className={sidebarInnerClasses}>
        <SidebarContent />
      </div>
    </div>
  )
}

Sidebar.displayName = "Sidebar"

export { Sidebar, SidebarItem }
