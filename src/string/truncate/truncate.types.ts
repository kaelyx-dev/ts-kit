// Public types for truncate.
// Every exported name must start with "Truncate".
export interface TruncateOptions {
    /**
     * The string to append to the end of the truncated string.
     * @default '...'
     */
    append?: string

    /**
     * Truncate to include length of the append string in the total length.
     * @default false
     */
    includeAppendInLength?: boolean

    /** 
     * Truncate at last word boundary before the length limit.
     * @default false
     */
    truncateAtWordBoundary?: boolean
}
