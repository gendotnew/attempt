import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/(auth)/_auth")({
  beforeLoad: () => {
    throw redirect({ to: "/", replace: true })
  },
})
