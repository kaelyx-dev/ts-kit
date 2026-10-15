import { describe, expect, it } from 'vitest'
import { stripComment, toRunnable, toRunnableLine } from './to-runnable'

describe('toRunnableLine', () => {
  it('wraps an expression and keeps the comment', () => {
    expect(toRunnableLine('sum([1, 2]) // 3')).toBe('console.log(sum([1, 2])) // 3')
  })

  it('keeps the gap before an aligned comment', () => {
    expect(toRunnableLine('sum([])     // 0')).toBe('console.log(sum([]))     // 0')
  })

  it('wraps an expression with no comment', () => {
    expect(toRunnableLine('ok(42)')).toBe('console.log(ok(42))')
  })

  it.each(['const a = 1', 'let a = 1', 'await run()', "import { a } from 'b'", 'console.log(1)'])(
    'does not change the statement %s',
    (line) => {
      expect(toRunnableLine(line)).toBe(line)
    },
  )

  it.each(['search(', ')', '  { debounceMs: 300 }),', '}'])(
    'does not change the unbalanced line %s',
    (line) => {
      expect(toRunnableLine(line)).toBe(line)
    },
  )

  it.each(['// a comment', '  // an indented comment', '/* a block */', ' * a doc line'])(
    'does not change the comment %s',
    (line) => {
      expect(toRunnableLine(line)).toBe(line)
    },
  )

  it.each(['', '   '])('does not change the empty line %j', (line) => {
    expect(toRunnableLine(line)).toBe(line)
  })

  it('removes a trailing semicolon before the wrap', () => {
    expect(toRunnableLine('sum([1]); // 1')).toBe('console.log(sum([1])) // 1')
  })

  it('ignores brackets and // inside strings', () => {
    expect(toRunnableLine("parse('http://a/(') // x")).toBe("console.log(parse('http://a/(')) // x")
    expect(toRunnableLine("f('it\\'s')")).toBe("console.log(f('it\\'s'))")
  })

  it('catches the error of a line that throws', () => {
    expect(toRunnableLine('clamp(5, { min: 10, max: 1 }) // throws RangeError')).toBe(
      'try { console.log(clamp(5, { min: 10, max: 1 })) } catch (error) { console.log(error) } // throws RangeError',
    )
  })
})

describe('toRunnable', () => {
  it('does not change the lines inside a statement on more than one line', () => {
    const code = ['const save = debounce(', '  (v) => v,', '  { debounceMs: 3 },', ')', "save('a')"]
    expect(toRunnable(code.join('\n'))).toBe(
      [...code.slice(0, 4), "console.log(save('a'))"].join('\n'),
    )
  })
})

describe('stripComment', () => {
  it('removes a trailing comment and keeps // inside a string', () => {
    expect(stripComment("f('a//b') // c")).toBe("f('a//b') ")
    expect(stripComment('f()')).toBe('f()')
  })
})
