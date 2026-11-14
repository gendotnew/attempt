import { Outlet, createFileRoute } from "@tanstack/react-router"
import { ThemeProvider } from "next-themes"

export const Route = createFileRoute("/_layout")({
  component: LayoutComponent,
})

function LayoutComponent() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <Outlet />
    </ThemeProvider>
  )
}
