import { fileURLToPath } from 'node:url'
import { type PlaygroundData, loadPlayground } from './playground'

export type { PlaygroundData, PlaygroundFunction } from './playground'

declare const data: PlaygroundData
export { data }

const root = fileURLToPath(new URL('../../../', import.meta.url))

export default {
  watch: ['../../../src/**/*.ts'] as string[],
  load: (): PlaygroundData => loadPlayground(root),
}
