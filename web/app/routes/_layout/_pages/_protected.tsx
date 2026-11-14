import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/_pages/_protected")({
  // Account tools are retired. Never turn private account routes into public data.
  beforeLoad: () => {
    throw redirect({ to: "/", replace: true })
  },
  component: () => <Outlet />,
})
