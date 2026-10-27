import { describe, expect, it } from 'vitest'
import { splitWords } from './words'
import type { SplitWordsOptions } from './words.type'

const defaults: SplitWordsOptions = {
  acronyms: new Set(),
  unknownAcronyms: 'together',
  minAcronymLength: 2,
  digits: 'left',
}

const split = (input: string, options: Partial<SplitWordsOptions> = {}): string[] =>
  splitWords(input, { ...defaults, ...options })

describe('splitWords', () => {
  describe('separators', () => {
    it('splits on whitespace', () => {
      expect(split('hello world')).toEqual(['hello', 'world'])
      expect(split('hello\tworld\nagain')).toEqual(['hello', 'world', 'again'])
    })

    it('splits on underscores, hyphens and other punctuation', () => {
      expect(split('hello_world')).toEqual(['hello', 'world'])
      expect(split('hello-world')).toEqual(['hello', 'world'])
      expect(split('hello.world/again')).toEqual(['hello', 'world', 'again'])
    })

    it('treats a run of separators as one', () => {
      expect(split('hello__--  world')).toEqual(['hello', 'world'])
    })

    it('ignores separators at the start and the end', () => {
      expect(split('  _hello world-  ')).toEqual(['hello', 'world'])
    })
  })

  describe('case boundaries', () => {
    it('splits where a lowercase letter is followed by an uppercase letter', () => {
      expect(split('helloWorld')).toEqual(['hello', 'World'])
      expect(split('HelloWorld')).toEqual(['Hello', 'World'])
    })

    it('keeps an acronym together and splits it from the next word', () => {
      expect(split('XMLHttpRequest')).toEqual(['XML', 'Http', 'Request'])
      expect(split('parseJSON')).toEqual(['parse', 'JSON'])
      expect(split('IOError')).toEqual(['IO', 'Error'])
    })

    it('does not split a word that is all uppercase', () => {
      expect(split('HELLO_WORLD')).toEqual(['HELLO', 'WORLD'])
    })

    it('does not split a word that is all lowercase', () => {
      expect(split('helloworld')).toEqual(['helloworld'])
    })
  })

  describe('known acronyms', () => {
    const acronyms = new Set(['XML', 'HTTP', 'HTTPS', 'API', 'ID', 'SSL'])

    it('splits a run of capitals into the known acronyms that make it', () => {
      expect(split('XMLHTTPRequest', { acronyms })).toEqual(['XML', 'HTTP', 'Request'])
      expect(split('getIDAPI', { acronyms })).toEqual(['get', 'ID', 'API'])
    })

    it('prefers the longest known acronym', () => {
      expect(split('HTTPSAPI', { acronyms })).toEqual(['HTTPS', 'API'])
    })

    it('prefers the longest known acronym when the run can be split in more than one way', () => {
      // HTTP + SAPI also makes the run, but HTTPS is longer than HTTP.
      const withSapi = new Set([...acronyms, 'SAPI'])
      expect(split('HTTPSAPI', { acronyms: withSapi })).toEqual(['HTTPS', 'API'])
    })

    it('uses a shorter acronym when the longest one leaves a part that is not known', () => {
      expect(split('HTTPSSL', { acronyms })).toEqual(['HTTP', 'SSL'])
    })

    it('splits an all-capital word that is made only of known acronyms', () => {
      expect(split('XMLHTTP_REQUEST', { acronyms })).toEqual(['XML', 'HTTP', 'REQUEST'])
    })

    it('does not split a run that is only partly made of known acronyms', () => {
      expect(split('IDENTITY', { acronyms })).toEqual(['IDENTITY'])
      expect(split('XMLFOORequest', { acronyms })).toEqual(['XMLFOO', 'Request'])
    })

    it('keeps a known acronym when unknown acronyms are split', () => {
      const options = { acronyms, unknownAcronyms: 'split' } as const
      expect(split('parseXMLData', options)).toEqual(['parse', 'XML', 'Data'])
    })

    it('keeps a known acronym that is shorter than the minimum length', () => {
      expect(split('userIDValue', { acronyms, minAcronymLength: 3 })).toEqual([
        'user',
        'ID',
        'Value',
      ])
    })
  })

  describe('unknown acronyms', () => {
    it('splits each capital into its own word when the mode is split', () => {
      expect(split('parseABCValue', { unknownAcronyms: 'split' })).toEqual([
        'parse',
        'A',
        'B',
        'C',
        'Value',
      ])
      expect(split('parseABC', { unknownAcronyms: 'split' })).toEqual(['parse', 'A', 'B', 'C'])
    })

    it('moves the last capital, with its combining accent, to the lowercase word after it', () => {
      expect(split('xABÉcole')).toEqual(['x', 'AB', 'École'])
    })

    it('splits a run that is shorter than the minimum length', () => {
      expect(split('IOError', { minAcronymLength: 3 })).toEqual(['I', 'O', 'Error'])
    })

    it('keeps a run that is as long as the minimum length', () => {
      expect(split('ABCDef', { minAcronymLength: 3 })).toEqual(['ABC', 'Def'])
    })

    it('counts letters, not code units, for the minimum length', () => {
      // 'É' is one letter with a combining accent, so the run 'ÉG' has 2 letters.
      expect(split('xÉGHy', { minAcronymLength: 3 })).toEqual(['x', 'É', 'G', 'Hy'])
    })

    it('keeps a combining accent with its capital when the run is split', () => {
      expect(split('xÉGHy', { unknownAcronyms: 'split' })).toEqual(['x', 'É', 'G', 'Hy'])
    })

    it('does not change an all-capital word', () => {
      expect(split('HELLO_WORLD', { unknownAcronyms: 'split' })).toEqual(['HELLO', 'WORLD'])
      expect(split('IO_ERROR', { minAcronymLength: 3 })).toEqual(['IO', 'ERROR'])
    })
  })

  describe('digits', () => {
    describe('left', () => {
      it('keeps digits with the letters before them', () => {
        expect(split('base64Encode')).toEqual(['base64', 'Encode'])
        expect(split('utf8')).toEqual(['utf8'])
        expect(split('version2update')).toEqual(['version2update'])
        expect(split('v2API')).toEqual(['v2', 'API'])
      })

      it('keeps digits with lowercase letters after them', () => {
        expect(split('3dModel')).toEqual(['3d', 'Model'])
      })

      it('splits where a digit is followed by an uppercase letter', () => {
        expect(split('ISO8601Date')).toEqual(['ISO8601', 'Date'])
      })
    })

    describe('right', () => {
      const digits = 'right'

      it('starts a new word at the digits', () => {
        expect(split('base64Encode', { digits })).toEqual(['base', '64Encode'])
        expect(split('version2update', { digits })).toEqual(['version', '2update'])
        expect(split('ISO8601Date', { digits })).toEqual(['ISO', '8601Date'])
        expect(split('v2API', { digits })).toEqual(['v', '2API'])
      })

      it('keeps digits at the end as their own word', () => {
        expect(split('utf8', { digits })).toEqual(['utf', '8'])
      })

      it('keeps digits with lowercase letters after them', () => {
        expect(split('3dModel', { digits })).toEqual(['3d', 'Model'])
      })
    })

    describe('separate', () => {
      const digits = 'separate'

      it('makes the digits a word of their own', () => {
        expect(split('base64Encode', { digits })).toEqual(['base', '64', 'Encode'])
        expect(split('version2update', { digits })).toEqual(['version', '2', 'update'])
        expect(split('ISO8601Date', { digits })).toEqual(['ISO', '8601', 'Date'])
        expect(split('3dModel', { digits })).toEqual(['3', 'd', 'Model'])
      })
    })

    it.each(['left', 'right', 'separate'] as const)(
      'keeps a number that is its own word when digits is %s',
      (digits) => {
        expect(split('version 2', { digits })).toEqual(['version', '2'])
        expect(split('2024', { digits })).toEqual(['2024'])
      },
    )
  })

  describe('Unicode', () => {
    it('keeps letters outside ASCII in the word', () => {
      expect(split('crèmeBrûlée')).toEqual(['crème', 'Brûlée'])
      expect(split('straße_größe')).toEqual(['straße', 'größe'])
    })

    it('keeps a combining accent with its letter', () => {
      const decomposed = 'caféBar'
      expect(split(decomposed)).toEqual(['café', 'Bar'])
    })

    it('keeps letters that have no case as one word', () => {
      expect(split('東京 タワー')).toEqual(['東京', 'タワー'])
    })

    it('treats emoji as a separator', () => {
      expect(split('hello😀world')).toEqual(['hello', 'world'])
    })

    it('drops the variation selector of an emoji with the emoji', () => {
      expect(split('hello❤️world')).toEqual(['hello', 'world'])
    })
  })

  describe('empty input', () => {
    it('returns no words for an empty string', () => {
      expect(split('')).toEqual([])
    })

    it('returns no words when the input has only separators', () => {
      expect(split(' _-. ')).toEqual([])
    })
  })
})
