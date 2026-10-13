// Public types for template.
// Every exported name must start with "Template".

import type { ValueOf } from '../../types'

/** The values for {@link TemplateOptions.replaceBehaviour}. */
export const TemplateOptionsReplaceBehaviour = {
  /** Replace every placeholder. */
  replaceAll: 'REPLACE_ALL',
  /** Replace only the first placeholder that the pattern matches. */
  replaceFirst: 'REPLACE_FIRST',
} as const

/** The values for {@link TemplateOptions.unknownBehaviour}. */
export const TemplateOptionsUnknownBehaviour = {
  /** Leave the placeholder in the output. */
  ignore: 'IGNORE',
  /** Remove the placeholder from the output. */
  remove: 'REMOVE',
  /** Throw an error. */
  throw: 'THROW',
} as const

/** The behavior for how replacements are applied. */
export type TemplateOptionsReplaceBehaviour = ValueOf<typeof TemplateOptionsReplaceBehaviour>

/** The behavior for how unknown placeholders are handled. */
export type TemplateOptionsUnknownBehaviour = ValueOf<typeof TemplateOptionsUnknownBehaviour>

/**
 * Options for configuring template behavior.
 */
export interface TemplateOptions {
  /** Determines how replacements are applied. @default TemplateOptionsReplaceBehaviour.replaceAll */
  replaceBehaviour?: TemplateOptionsReplaceBehaviour

  /** Placeholder Pattern @default /\{\{(\w+)\}\}/g */
  placeholderPattern?: RegExp

  /** Determines what the function does if it encounters an unknown placeholder. @default TemplateOptionsUnknownBehaviour.ignore */
  unknownBehaviour?: TemplateOptionsUnknownBehaviour
}
