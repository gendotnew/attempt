import * as React from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { GraphData } from "~/lib/constants"
import {
  ContentHeader,
  SidebarToggleButton,
} from "~/components/custom/content-header"
import { LaIcon } from "~/components/custom/la-icon"

export const Route = createFileRoute("/_layout/_pages/search/")({
  component: SearchComponent,
})

function SearchComponent() {
  const [query, setQuery] = React.useState("")
  const [limit, setLimit] = React.useState(100)
  const topics = React.useMemo(
    () =>
      GraphData.filter((topic) =>
        topic.prettyName.toLowerCase().includes(query.trim().toLowerCase()),
      ).sort((a, b) => a.prettyName.localeCompare(b.prettyName)),
    [query],
  )

  return (
    <>
      <ContentHeader>
        <SidebarToggleButton />
        <h1 className="font-semibold">Explore topics</h1>
      </ContentHeader>
      <div className="mx-auto w-full max-w-4xl overflow-y-auto px-4 py-6 sm:px-8">
        <label className="relative block">
          <LaIcon
            name="Search"
            aria-hidden="true"
            className="absolute left-3 top-3 text-muted-foreground"
          />
          <input
            type="search"
            aria-label="Search topics"
            placeholder="What would you like to learn?"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setLimit(100)
            }}
            className="w-full rounded-lg border bg-input py-2.5 pl-10 pr-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <p className="my-4 text-sm text-muted-foreground" role="status">
          {topics.length} topics
        </p>
        <ul className="grid gap-1 sm:grid-cols-2">
          {topics.slice(0, limit).map((topic) => (
            <li key={topic.name}>
              <Link
                to={`/${topic.name}`}
                className="block rounded-md px-3 py-3 text-sm hover:bg-muted focus-visible:outline focus-visible:outline-2"
              >
                {topic.prettyName}
              </Link>
            </li>
          ))}
        </ul>
        {topics.length === 0 && (
          <p className="py-8 text-muted-foreground">
            No matching topics. Try another search.
          </p>
        )}
        {topics.length > limit && (
          <button
            className="mt-5 rounded-md border px-4 py-2 text-sm hover:bg-muted"
            onClick={() => setLimit((value) => value + 100)}
          >
            Show more topics
          </button>
        )}
      </div>
    </>
  )
}
