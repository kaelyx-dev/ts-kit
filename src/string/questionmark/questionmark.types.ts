// Public types for questionmark.
// Every exported name must start with "Questionmark".

/** Options for {@link questionmark}. */
export interface QuestionmarkOptions {
  /** The characters that should be replaced when found at the end.
   *  Defaults to `.`, `!` and `?`. */
  readonly replacementCharacters?: readonly string[]
  /** Strip trailing whitespace before deciding, and drop it from the result. */
  readonly trim?: boolean
  /** Treat a run of replacement characters as one: "What.!" -> "What?" */
  readonly collapse?: boolean
  /** Leave a string with no content alone instead of returning bare punctuation. */
  readonly skipEmpty?: boolean
}
