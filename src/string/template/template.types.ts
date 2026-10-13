// Public types for template.
// Every exported name must start with "Template".

import type { ValueOf } from "../../types"


export const TemplateOptionsReplaceBehaviour = { replaceAll: 'REPLACE_ALL', replaceFirst: 'REPLACE_FIRST' } as const
export const TemplateOptionsUnknownBehaviour = { ignore: 'IGNORE', remove: 'REMOVE', throw: 'THROW' } as const

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