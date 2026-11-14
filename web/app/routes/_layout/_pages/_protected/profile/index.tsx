import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/_pages/_protected/profile/")({
  beforeLoad: () => {
    throw redirect({ to: "/", replace: true })
  },
})
