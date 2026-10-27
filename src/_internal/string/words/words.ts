import type { SplitWordsOptions } from './words.type'

// A combining mark (\p{M}) belongs to the character before it, so 'é' written as 'e' and U+0301
// stays whole. A mark that does not follow a letter or digit, such as the variation selector in
// '❤️', is dropped with the separators.
const CHUNK = /(?:[\p{L}\p{N}]\p{M}*)+/gu
// A chunk is made of runs of capitals, digits and other letters. Letters with no case, such as
// '東', count as lowercase, so they never start a word.
const RUN = /(?:\p{Lu}\p{M}*)+|(?:\p{N}\p{M}*)+|(?:[^\p{Lu}\p{N}]\p{M}*)+/gu
const CAPITAL = /\p{Lu}\p{M}*/gu
const LAST_CAPITAL = /\p{Lu}\p{M}*$/u
const STARTS_UPPER = /^\p{Lu}/u
const STARTS_DIGIT = /^\p{N}/u

type PieceKind = 'capitals' | 'capitalised' | 'lower' | 'digits'

/** Part of a word. Pieces are joined into words by the digit rule in joinsNext. */
interface Piece {
  readonly text: string
  readonly kind: PieceKind
}

function kindOf(run: string): PieceKind {
  if (STARTS_UPPER.test(run)) return 'capitals'
  if (STARTS_DIGIT.test(run)) return 'digits'
  return 'lower'
}

/**
 * Split runs into pieces. When lowercase letters follow a run of capitals, the last capital starts
 * the lowercase word: 'XMLHttp' gives 'XML' and 'Http'.
 */
function toPieces(runs: readonly string[]): Piece[] {
  const pieces: Piece[] = []
  for (const run of runs) {
    const kind = kindOf(run)
    const previous = pieces.at(-1)
    if (kind === 'lower' && previous?.kind === 'capitals') {
      const rest = previous.text.replace(LAST_CAPITAL, '')
      const last = previous.text.slice(rest.length)
      pieces.pop()
      if (rest !== '') pieces.push({ text: rest, kind: 'capitals' })
      pieces.push({ text: last + run, kind: 'capitalised' })
    } else {
      pieces.push({ text: run, kind })
    }
  }
  return pieces
}

/**
 * Split a run of capitals into known acronyms. Returns undefined if known acronyms do not make
 * the whole run, so that a word such as 'IDENTITY' is not read as 'ID' and 'ENTITY'.
 */
function splitKnown(run: string, acronyms: ReadonlySet<string>): string[] | undefined {
  // splits[i] is a split of run.slice(i), or undefined if there is none.
  const splits: (string[] | undefined)[] = []
  splits[run.length] = []
  for (let start = run.length - 1; start >= 0; start--) {
    // Try the longest acronym first.
    for (let end = run.length; end > start; end--) {
      const rest = splits[end]
      const head = run.slice(start, end)
      if (rest !== undefined && acronyms.has(head)) {
        splits[start] = [head, ...rest]
        break
      }
    }
  }
  return splits[0]
}

function splitCapitals(
  piece: Piece,
  inMixedCase: boolean,
  { acronyms, unknownAcronyms, minAcronymLength }: SplitWordsOptions,
): Piece[] {
  const known = splitKnown(piece.text, acronyms)
  if (known !== undefined) return known.map((text) => ({ text, kind: 'capitals' }))

  // An all-capital word, such as HELLO in HELLO_WORLD, is a word and not an acronym.
  if (!inMixedCase) return [piece]

  const letters = Array.from(piece.text.matchAll(CAPITAL), ([letter]) => letter)
  if (unknownAcronyms === 'split' || letters.length < minAcronymLength) {
    return letters.map((text) => ({ text, kind: 'capitals' }))
  }
  return [piece]
}

/** Whether two pieces next to each other are in the same word. */
function joinsNext(piece: Piece, next: Piece, digits: SplitWordsOptions['digits']): boolean {
  if (digits === 'separate') return false
  if (digits === 'right') return piece.kind === 'digits'
  // 'left': digits join the piece before them, and lowercase letters join the digits before them.
  return next.kind === 'digits' || (piece.kind === 'digits' && next.kind === 'lower')
}

function splitChunk(chunk: string, options: SplitWordsOptions): string[] {
  const runs = Array.from(chunk.matchAll(RUN), ([run]) => run)
  const inMixedCase = runs.some((run) => kindOf(run) === 'lower')
  const pieces = toPieces(runs).flatMap((piece) =>
    piece.kind === 'capitals' ? splitCapitals(piece, inMixedCase, options) : [piece],
  )

  const words: string[] = []
  pieces.forEach((piece, index) => {
    const previous = pieces[index - 1]
    if (previous !== undefined && joinsNext(previous, piece, options.digits)) {
      words[words.length - 1] += piece.text
    } else {
      words.push(piece.text)
    }
  })
  return words
}

/**
 * Split a string into words, whatever case it is written in. Words are separated by any character
 * that is not a letter or a digit, by a change from lowercase to uppercase, and by the acronym and
 * digit rules in the options. The words keep the case they have in the input.
 */
export function splitWords(input: string, options: SplitWordsOptions): string[] {
  const chunks = input.match(CHUNK) ?? []
  return chunks.flatMap((chunk) => splitChunk(chunk, options))
}
