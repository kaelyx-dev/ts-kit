/**
 * Types for the word splitter.
 */

/** Every option decided. The public function resolves its defaults before it calls splitWords. */
export interface SplitWordsOptions {
  /** Known acronyms, in capitals. */
  readonly acronyms: ReadonlySet<string>
  /** How to read a run of capitals that is not made of known acronyms. */
  readonly unknownAcronyms: 'together' | 'split'
  /** A shorter run of unknown capitals is split into single letters. */
  readonly minAcronymLength: number
  /** Which word the digits go into. */
  readonly digits: 'left' | 'right' | 'separate'
}
