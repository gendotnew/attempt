import * as React from "react"
import {
  ContentHeader,
  SidebarToggleButton,
} from "@/components/custom/content-header"
import { Topic } from "@/lib/schema"
import { Input } from "~/components/ui/input"
import { LaIcon } from "~/components/custom/la-icon"

interface TopicDetailHeaderProps {
  topic: Topic
  searchQuery: string
  setSearchQuery: (query: string) => void
}

export function TopicDetailHeader({
  topic,
  searchQuery,
  setSearchQuery,
}: TopicDetailHeaderProps) {
  return (
    <>
      <ContentHeader>
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <SidebarToggleButton />
          <h1 className="truncate text-left font-semibold lg:text-lg">
            {topic.prettyName}
          </h1>
        </div>
      </ContentHeader>
      <div className="flex min-h-10 items-center gap-2 border-b border-b-[var(--la-border-new)] px-6 py-2 max-lg:px-4">
        <LaIcon
          name="Search"
          className="text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          className="h-6 flex-1 border-none bg-transparent p-0 focus-visible:ring-0"
          placeholder="Search resources..."
          aria-label="Search resources in this topic"
          role="searchbox"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      </div>
    </>
  )
}
