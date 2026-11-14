import { createJazzReactApp } from "jazz-react"
import { LaAccount } from "@/lib/schema"
import { getEnvVariable } from "../utils"

const Jazz = createJazzReactApp({
  AccountSchema: LaAccount,
})

export const { useAccount, useAccountOrGuest, useCoState, useAcceptInvite } =
  Jazz

function assertPeerUrl(
  url: string | undefined,
): asserts url is `wss://${string}` | `ws://${string}` {
  if (!url) {
    throw new Error("JAZZ_PEER_URL is not defined")
  }
  if (!url.startsWith("wss://") && !url.startsWith("ws://")) {
    throw new Error("JAZZ_PEER_URL must start with wss:// or ws://")
  }
}

const JAZZ_PEER_URL = (() => {
  const rawUrl = getEnvVariable(
    "VITE_JAZZ_PEER_URL",
    "wss://sync-la.jazz.tools/?key=client@learn-anything.xyz",
  )
  assertPeerUrl(rawUrl)
  return rawUrl
})()

interface ChildrenProps {
  children: React.ReactNode
}

export function JazzGuest({ children }: ChildrenProps) {
  return (
    <Jazz.Provider auth="guest" peer={JAZZ_PEER_URL}>
      {children}
    </Jazz.Provider>
  )
}
