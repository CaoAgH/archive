/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/IDuxFE/archive/blob/main/LICENSE
 */

import type { Instance, Loader } from '@idux/archive-vite-plugin'
import type { Except, SetOptional } from 'type-fest'
import type { App, VNode } from 'vue'

export type Lang = 'zh' | 'en'
export type Theme = 'default' | 'seer'
export type ArchiveLoaderVue = Loader<VueItemMeta>

export interface ArchiveLoaderVueOptions extends SetOptional<Except<Loader, 'name'>, 'matched'> {
  setup?: string
  srcDir?: string
  includeMeta?: boolean
  includeSourceCodes?: boolean
}

export interface ArchiveLoaderVueSetup {
  setupApp?: (app: App) => void
  renderApp?: (children: VNode[]) => VNode
}

export type ArchiveLoaderVueInstance = Instance

export interface SourceCode {
  filename: string
  code: string
  parsedCode: string
}

export interface VueItemMeta {
  dependencies?: string[]
  title?: string
  description?: string
}