/**
 * stacks.js — 技术栈清单与检索列（L2 纯数据）
 *
 * 本模块不 import 任何其他 lib 模块。
 */

/** 技术栈键（对应上游 STACK_CONFIG） */
export const STACKS = [
  'react', 'nextjs', 'vue', 'svelte', 'astro', 'swiftui', 'react-native',
  'flutter', 'nuxtjs', 'nuxt-ui', 'html-tailwind', 'shadcn', 'jetpack-compose',
  'threejs', 'angular', 'laravel', 'javafx', 'wpf', 'winui', 'avalonia', 'uno', 'uwp',
]

export const STACK_SEARCH_COLS = ['Category', 'Guideline', 'Description', 'Do', "Don't", 'Code Good', 'Code Bad']
export const STACK_OUTPUT_COLS = ['Category', 'Guideline', 'Description', 'Do', "Don't", 'Code Good', 'Code Bad', 'Severity', 'Docs URL', 'Applies To', 'Status', 'Verified At']
