import { ActionIcon, TextInput } from "@mantine/core";
import { useEffect, useState } from "react"
import { IconSearch, IconX } from "@tabler/icons";

/**
 * Debounced search input.
 * 
 * @param props 
 * @returns 
 */
export default function SearchInput(props: {
  /**
   * Query value
   */
  value: string
  /**
   * Debounced callback triggered when the value changes, after a delay.
   * 
   * @param value The query value.
   * @returns 
   */
  onChange: (value: string) => void
  /**
   * The debounce delay (in ms)
   */
  delay?: number
  /**
   * If the input is in error mode.
   */
  error?: boolean
}) {

  const [query, setQuery] = useState(props.value)

  useEffect(() => {
    const timer = setTimeout(() => props.onChange(query), props.delay || 500)
    return () => {
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, props.delay])

  return (
    <TextInput
      placeholder="Search..."
      value={query}
      error={props.error}
      rightSection={
        <ActionIcon onClick={() => setQuery("")}>
          {query ? (
            <IconX size={16} />
          ) : (
            <IconSearch size={16} />
          )}
        </ActionIcon>
      }
      onChange={(event) => setQuery(event.currentTarget.value)}
    />
  )
}
