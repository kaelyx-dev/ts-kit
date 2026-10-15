const STATEMENT_KEYWORDS: RegExp =
  /^(const|let|var|await|import|export|function|class|type|interface|if|for|while|return|throw)\b/

const OPENERS = '([{'
const CLOSERS = ')]}'
const QUOTES = `'"\``

interface LineScan {
  /** The change in bracket depth over the line, outside strings and the comment. */
  depth: number
  /** The index where a trailing `//` comment starts, or -1. */
  commentStart: number
}

/** Reads a line once, skipping strings, so a `//` or a bracket inside a string is ignored. */
const scanLine = (line: string): LineScan => {
  let depth = 0
  let quote: string | undefined
  for (let i = 0; i < line.length; i++) {
    const char = line[i] as string
    if (quote) {
      if (char === '\\') i++
      else if (char === quote) quote = undefined
    } else if (QUOTES.includes(char)) {
      quote = char
    } else if (char === '/' && line[i + 1] === '/') {
      return { depth, commentStart: i }
    } else if (OPENERS.includes(char)) {
      depth++
    } else if (CLOSERS.includes(char)) {
      depth--
    }
  }
  return { depth, commentStart: -1 }
}

/** Removes a trailing `//` comment from a line. A `//` inside a string is kept. */
export const stripComment = (line: string): string => {
  const { commentStart } = scanLine(line)
  return commentStart === -1 ? line : line.slice(0, commentStart)
}

const isComment = (trimmed: string): boolean =>
  trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')

/**
 * Converts one example line so that it shows its result. Returns the line with no change if it is
 * empty, a comment, a statement, a `console.` call, or if its brackets do not balance. If the
 * comment starts with `throws`, the error is caught and logged, so the lines after it still run.
 */
export const toRunnableLine = (line: string): string => {
  const trimmed = line.trim()
  if (trimmed === '' || isComment(trimmed)) return line
  if (STATEMENT_KEYWORDS.test(trimmed) || trimmed.startsWith('console.')) return line

  const { depth, commentStart } = scanLine(line)
  if (depth !== 0) return line

  const code = commentStart === -1 ? line : line.slice(0, commentStart)
  const comment = commentStart === -1 ? '' : line.slice(commentStart)
  const indent = code.slice(0, code.length - code.trimStart().length)
  const gap = code.slice(code.trimEnd().length)
  const expression = code.trim().replace(/;+$/, '')
  if (/^\/\/\s*throws\b/i.test(comment)) {
    return `${indent}try { console.log(${expression}) } catch (error) { console.log(error) }${gap}${comment}`
  }
  return `${indent}console.log(${expression})${gap}${comment}`
}

/**
 * Converts an example so that each top-level expression line shows its result. A line inside a
 * statement on more than one line does not change, even if its own brackets balance.
 */
export const toRunnable = (code: string): string => {
  let depth = 0
  return code
    .split('\n')
    .map((line) => {
      const converted = depth === 0 ? toRunnableLine(line) : line
      depth = Math.max(0, depth + scanLine(line).depth)
      return converted
    })
    .join('\n')
}
