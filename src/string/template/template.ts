import { withDefaults } from '../../object/with-defaults/with-defaults'
import {
  type TemplateOptions,
  TemplateOptionsReplaceBehaviour,
  TemplateOptionsUnknownBehaviour,
} from './template.types'

export * from './template.types'

/**
 * Replaces the placeholders in a string with values from `variables`.
 *
 * The first capture group of `placeholderPattern` is the variable name. A placeholder is unknown
 * if `variables` has no own key with that name.
 *
 * @param input - The template. An empty string returns an empty string.
 * @param variables - The values to use. Each value is converted with `String()`.
 * @param options - How to replace placeholders and what to do with unknown placeholders.
 * @returns A new string with the placeholders replaced.
 * @throws If `unknownBehaviour` is `TemplateOptionsUnknownBehaviour.throw` and the input contains an unknown placeholder.
 *
 * @example
 * ```ts
 * template('Hello, {{name}}!', { name: 'Ada' }) // 'Hello, Ada!'
 * template('{{count}} items, in stock: {{inStock}}', { count: 3, inStock: true }) // '3 items, in stock: true'
 * template('{{a}} {{b}}', { a: 1 }) // '1 {{b}}'
 * template('{{a}} {{b}}', { a: 1 }, { unknownBehaviour: TemplateOptionsUnknownBehaviour.remove }) // '1 '
 * template('{{a}}', {}, { unknownBehaviour: TemplateOptionsUnknownBehaviour.throw }) // throws Error
 * template('{{a}} {{a}}', { a: 1 }, { replaceBehaviour: TemplateOptionsReplaceBehaviour.replaceFirst }) // '1 {{a}}'
 * template('Hello, ${name}!', { name: 'Ada' }, { placeholderPattern: /\$\{(\w+)\}/ }) // 'Hello, Ada!'
 * ```
 *
 * @category string
 */
export function template(
  input: string,
  variables: Record<string, unknown>,
  options?: TemplateOptions,
): string {
  const opts = withDefaults(options, {
    replaceBehaviour: TemplateOptionsReplaceBehaviour.replaceAll,
    placeholderPattern: /\{\{(\w+)\}\}/g,
    unknownBehaviour: TemplateOptionsUnknownBehaviour.ignore,
  })

  // A new RegExp makes sure the pattern is global and does not share `lastIndex` with the caller.
  const flags = opts.placeholderPattern.flags.includes('g')
    ? opts.placeholderPattern.flags
    : `${opts.placeholderPattern.flags}g`
  const pattern = new RegExp(opts.placeholderPattern.source, flags)

  // With no capture group, `replace` passes the match offset (a number) as the second argument.
  const replacer = (placeholder: string, name: unknown): string => {
    const key = typeof name === 'string' ? name : placeholder
    if (Object.hasOwn(variables, key)) return String(variables[key])
    if (opts.unknownBehaviour === TemplateOptionsUnknownBehaviour.throw) {
      throw new Error(`template: unknown placeholder "${placeholder}"`)
    }
    return opts.unknownBehaviour === TemplateOptionsUnknownBehaviour.remove ? '' : placeholder
  }

  if (opts.replaceBehaviour === TemplateOptionsReplaceBehaviour.replaceFirst) {
    // A non-global copy makes `replace` stop after the first match.
    return input.replace(new RegExp(pattern.source, flags.replace('g', '')), replacer)
  }

  return input.replace(pattern, replacer)
}
