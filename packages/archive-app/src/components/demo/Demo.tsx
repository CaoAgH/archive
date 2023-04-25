/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/IDuxFE/archive/blob/main/LICENSE
 */

import type { DemoTool, ResolvedDemoItem } from '@idux/archive-types'
import type { SetOptional } from 'type-fest'

import {
  type DefineComponent,
  type ExtractPropTypes,
  type PropType,
  Transition,
  computed,
  defineComponent,
  ref,
} from 'vue'

import { throttle } from 'lodash-es'

import { Instance } from '@idux/archive-loader-vue/client'
import { useClipboard } from '@idux/cdk/clipboard'
import { IxIcon } from '@idux/components/icon'
import { useMessage } from '@idux/components/message'
import { IxTab, IxTabs } from '@idux/components/tabs'

import DemoContorlComp from './DemoControl'
import DemoToolComp from './DemoTool'

export const demoProps = {
  lang: { type: String as PropType<'zh' | 'en'>, default: 'zh' },
  prefixCls: { type: String, default: 'archive-app' },
  resolvedDemoItem: { type: Object as PropType<ResolvedDemoItem>, required: true },
  tools: Array as PropType<DemoTool[]>,
} as const
export type DemoProps = SetOptional<ExtractPropTypes<typeof demoProps>, 'lang' | 'prefixCls' | 'tools'>
export default defineComponent({
  props: demoProps,
  setup(props) {
    const mergedPrefixCls = `${props.prefixCls}-demo`
    const mergedTools = computed<DemoTool[]>(() => {
      if ((props.tools?.findIndex(tool => tool.type === 'expandCode') ?? -1) > -1) {
        return props.tools!
      }

      return [...(props.tools ?? []), { type: 'expandCode' }, { type: 'expandControls' }] as DemoTool[]
    })

    const selectedSourceTab = ref(0)
    const handleSelectedSourceTabChange = (tab: number) => {
      selectedSourceTab.value = tab
    }

    const expanded = ref<'code' | 'controls' | ''>('')

    const expandedCodeTitle = computed(() => {
      if (props.lang === 'zh') {
        return expanded.value === 'code' ? '收起代码' : '显示代码'
      }
      return expanded.value === 'code' ? 'Hide Code' : 'Show Code'
    })
    const expandedControlsTitle = computed(() => {
      if (props.lang === 'zh') {
        return expanded.value === 'controls' ? '收起控制' : '显示控制'
      }
      return expanded.value === 'controls' ? 'Hide Controls' : 'Show Controls'
    })
    const copyTitle = computed(() => (props.lang === 'zh' ? '复制代码' : 'Copy Code'))

    const onExpanded = (target: 'code' | 'controls') => {
      expanded.value = expanded.value === target ? '' : target
    }

    const { copy } = useClipboard()
    const { success } = useMessage()

    const onCopy = throttle(async () => {
      const code = props.resolvedDemoItem?.sourceCodes?.[selectedSourceTab.value ?? 0].code
      code &&
        copy(decodeURIComponent(code)).then(() => {
          success(props.lang === 'zh' ? '复制成功' : 'copy succeeded')
        })
    }, 300)

    // todo: provide custom rendering
    const renderTool = (tool: DemoTool) => {
      if (tool.type === 'expandCode') {
        return (
          <DemoToolComp
            prefixCls={props.prefixCls!}
            tooltip={tool.tooltip ?? expandedCodeTitle.value}
            onClick={() => onExpanded('code')}
          >
            <IxIcon name={expanded.value === 'code' ? 'unexpand' : 'expand'} />
          </DemoToolComp>
        )
      }

      if (tool.type === 'expandControls') {
        return (
          <DemoToolComp
            prefixCls={props.prefixCls!}
            tooltip={tool.tooltip ?? expandedControlsTitle.value}
            onClick={() => onExpanded('controls')}
          >
            <IxIcon name={expanded.value === 'controls' ? 'up' : 'control'} />
          </DemoToolComp>
        )
      }

      if (tool.type === 'copyCode') {
        return (
          <DemoToolComp prefixCls={props.prefixCls!} tooltip={tool.tooltip ?? copyTitle.value} onClick={onCopy}>
            {tool.render ? tool.render() : <IxIcon name={'copy'}></IxIcon>}
          </DemoToolComp>
        )
      }

      if (tool.type === 'link') {
        return (
          <DemoToolComp prefixCls={props.prefixCls!} tooltip={tool.tooltip} onClick={onCopy}>
            <a class={`${mergedPrefixCls}__tool-link`} href={tool.link} target="_blank" rel="noopener noreferrer">
              {tool.render ? tool.render() : <IxIcon name={'link'}></IxIcon>}
            </a>
          </DemoToolComp>
        )
      }
    }

    const renderSourceCode = () => {
      const sourceCodes = props.resolvedDemoItem?.sourceCodes
      if (expanded.value !== 'code' || !sourceCodes) {
        return
      }

      const contentCls = `${mergedPrefixCls}__source-code__content`
      let children
      if (sourceCodes.length === 1) {
        children = <div class={contentCls} v-html={sourceCodes[0].parsedCode}></div>
      } else {
        children = (
          <IxTabs selectedKey={selectedSourceTab.value} onUpdate:selectedKey={handleSelectedSourceTabChange}>
            {sourceCodes.map((sourceCode, idx) => (
              <IxTab key={idx} title={sourceCode.filename}>
                <div class={contentCls} v-html={sourceCode.parsedCode}></div>
              </IxTab>
            ))}
          </IxTabs>
        )
      }

      return <div class={`${mergedPrefixCls}__source-code archive-md`}>{children}</div>
    }

    const renderDemoControl = (demoItem: ResolvedDemoItem) => {
      if (expanded.value === 'controls' && demoItem.controls && demoItem.instance) {
        return (
          <DemoContorlComp prefixCls={props.prefixCls!} controls={demoItem.controls} instance={demoItem.instance} />
        )
      }
    }
    return () => {
      const demoItem = props.resolvedDemoItem!
      return (
        <div class={mergedPrefixCls}>
          {demoItem.title && (
            <h3 id={demoItem.id} class={`${mergedPrefixCls}__title`}>
              <span>{demoItem.title}</span>
              <a class="anchor" href={'#' + demoItem.id}>
                #
              </a>
            </h3>
          )}
          {demoItem.description && <p class={`${mergedPrefixCls}__description`}>{demoItem.description}</p>}
          <div class={`${mergedPrefixCls}__content`}>
            <div class={`${mergedPrefixCls}__content-inner`}>
              <div class={`${mergedPrefixCls}__stage`}>
                <Instance instance={demoItem.instance} />
              </div>
              <div class={`${mergedPrefixCls}__tools`}>{mergedTools.value.map(tool => renderTool(tool))}</div>
            </div>
          </div>
          <Transition name={`${mergedPrefixCls}-code-fade-down`}>{renderSourceCode()}</Transition>
          <Transition name={`${mergedPrefixCls}-code-fade-down`}>{renderDemoControl(demoItem)}</Transition>
        </div>
      )
    }
  },
}) as DefineComponent<DemoProps>
