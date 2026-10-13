import { describe, expect, it } from 'vitest'
import { template } from './template'
import { TemplateOptionsReplaceBehaviour, TemplateOptionsUnknownBehaviour } from './template.types'

describe('template', () => {
  describe('default options', () => {
    it('replaces a placeholder with its value', () => {
      expect(template('Hello, {{name}}!', { name: 'Ada' })).toBe('Hello, Ada!')
    })

    it('replaces every placeholder', () => {
      expect(template('{{a}} {{b}} {{a}}', { a: 1, b: 2 })).toBe('1 2 1')
    })

    it('returns an empty string for empty input', () => {
      expect(template('', { name: 'Ada' })).toBe('')
    })

    it('returns the input when it has no placeholders', () => {
      expect(template('Hello, world!', { name: 'Ada' })).toBe('Hello, world!')
    })

    it('leaves unknown placeholders in place', () => {
      expect(template('{{a}} {{b}}', { a: 1 })).toBe('1 {{b}}')
      expect(template('{{a}}', {})).toBe('{{a}}')
    })

    it('does not match placeholders that the default pattern does not allow', () => {
      expect(template('{{ a }} {{a-b}}', { a: 1, 'a-b': 2 })).toBe('{{ a }} {{a-b}}')
    })
  })

  describe('values', () => {
    it('converts values with String()', () => {
      expect(
        template('{{n}} {{b}} {{nil}} {{u}} {{arr}}', {
          n: 0,
          b: false,
          nil: null,
          u: undefined,
          arr: [1, 2],
        }),
      ).toBe('0 false null undefined 1,2')
    })

    it('uses an empty string value', () => {
      expect(template('[{{a}}]', { a: '' })).toBe('[]')
    })

    it('does not treat inherited keys as variables', () => {
      expect(template('{{toString}}', {})).toBe('{{toString}}')
      expect(() =>
        template(
          '{{constructor}}',
          {},
          { unknownBehaviour: TemplateOptionsUnknownBehaviour.throw },
        ),
      ).toThrow('template: unknown placeholder "{{constructor}}"')
    })

    it('does not replace placeholders inside inserted values', () => {
      expect(template('{{a}}', { a: '{{b}}', b: 'x' })).toBe('{{b}}')
    })

    it('inserts values that contain replacement patterns as plain text', () => {
      expect(template('{{a}}', { a: '$& $1 $$' })).toBe('$& $1 $$')
    })
  })

  describe('unknownBehaviour', () => {
    it('removes unknown placeholders with "remove"', () => {
      expect(
        template(
          '{{a}} {{b}}',
          { a: 1 },
          { unknownBehaviour: TemplateOptionsUnknownBehaviour.remove },
        ),
      ).toBe('1 ')
    })

    it('throws on an unknown placeholder with "throw"', () => {
      expect(() =>
        template(
          '{{a}} {{b}}',
          { a: 1 },
          { unknownBehaviour: TemplateOptionsUnknownBehaviour.throw },
        ),
      ).toThrow('template: unknown placeholder "{{b}}"')
    })

    it('does not throw with "throw" when every placeholder is known', () => {
      expect(
        template('{{a}}', { a: 1 }, { unknownBehaviour: TemplateOptionsUnknownBehaviour.throw }),
      ).toBe('1')
    })
  })

  describe('replaceBehaviour', () => {
    it('replaces only the first placeholder with "replaceFirst"', () => {
      expect(
        template(
          '{{a}} {{a}}',
          { a: 1 },
          { replaceBehaviour: TemplateOptionsReplaceBehaviour.replaceFirst },
        ),
      ).toBe('1 {{a}}')
      expect(
        template(
          '{{a}} {{b}}',
          { a: 1, b: 2 },
          { replaceBehaviour: TemplateOptionsReplaceBehaviour.replaceFirst },
        ),
      ).toBe('1 {{b}}')
    })

    it('applies unknownBehaviour to the first placeholder with "replaceFirst"', () => {
      const options = { replaceBehaviour: TemplateOptionsReplaceBehaviour.replaceFirst }
      expect(template('{{x}} {{a}}', { a: 1 }, options)).toBe('{{x}} {{a}}')
      expect(
        template(
          '{{x}} {{a}}',
          { a: 1 },
          { ...options, unknownBehaviour: TemplateOptionsUnknownBehaviour.remove },
        ),
      ).toBe(' {{a}}')
      expect(() =>
        template(
          '{{x}} {{a}}',
          { a: 1 },
          { ...options, unknownBehaviour: TemplateOptionsUnknownBehaviour.throw },
        ),
      ).toThrow('template: unknown placeholder "{{x}}"')
    })

    it('does not throw for unknown placeholders after the first with "replaceFirst"', () => {
      expect(
        template(
          '{{a}} {{x}}',
          { a: 1 },
          {
            replaceBehaviour: TemplateOptionsReplaceBehaviour.replaceFirst,
            unknownBehaviour: TemplateOptionsUnknownBehaviour.throw,
          },
        ),
      ).toBe('1 {{x}}')
    })
  })

  describe('placeholderPattern', () => {
    it('uses a custom pattern', () => {
      expect(template('${a} ${b}', { a: 1, b: 2 }, { placeholderPattern: /\$\{(\w+)\}/g })).toBe(
        '1 2',
      )
    })

    it('replaces every match when the pattern is not global', () => {
      expect(template('${a} ${b}', { a: 1, b: 2 }, { placeholderPattern: /\$\{(\w+)\}/ })).toBe(
        '1 2',
      )
    })

    it('replaces only the first match of a global pattern with "replaceFirst"', () => {
      expect(
        template(
          ':a :a',
          { a: 1 },
          {
            placeholderPattern: /:(\w+)/g,
            replaceBehaviour: TemplateOptionsReplaceBehaviour.replaceFirst,
          },
        ),
      ).toBe('1 :a')
    })

    it('keeps the other flags of the pattern', () => {
      expect(template('{{NAME}}', { name: 'Ada' }, { placeholderPattern: /\{\{(name)\}\}/i })).toBe(
        '{{NAME}}',
      )
      expect(template('{{NAME}}', { NAME: 'Ada' }, { placeholderPattern: /\{\{(name)\}\}/i })).toBe(
        'Ada',
      )
    })

    it('uses the whole match as the name when the pattern has no capture group', () => {
      expect(template('@user', { '@user': 'Ada' }, { placeholderPattern: /@\w+/ })).toBe('Ada')
    })

    it('uses the first capture group when the pattern has more than one', () => {
      expect(template('<a:b>', { a: 1, b: 2 }, { placeholderPattern: /<(\w+):(\w+)>/ })).toBe('1')
    })

    it('does not change the lastIndex of the pattern', () => {
      const pattern = /\{\{(\w+)\}\}/g
      pattern.lastIndex = 3
      template('{{a}} {{a}}', { a: 1 }, { placeholderPattern: pattern })
      expect(pattern.lastIndex).toBe(3)
    })
  })

  it('does not change the variables', () => {
    const variables = { a: 1 }
    template('{{a}} {{b}}', variables, { unknownBehaviour: TemplateOptionsUnknownBehaviour.remove })
    expect(variables).toEqual({ a: 1 })
  })
})
