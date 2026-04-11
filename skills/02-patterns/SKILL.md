---
name: dashboard-patterns
description: Edgion Controller 开发模式——列表页、编辑器、类型定义、工具函数的标准模板
---

# 开发模式

本目录记录了 Edgion Controller 中已验证的开发模式。新增资源页面时严格遵循这些模式，保持一致性。

## 文件清单

| 文件 | 内容 |
|------|------|
| [01-list-page.md](01-list-page.md) | 列表页模式：Table + 搜索 + 批量操作 + React Query |
| [02-editor-modal.md](02-editor-modal.md) | 编辑器模式：Modal + Form/YAML 双标签 + 双向同步 |
| [03-types-and-utils.md](03-types-and-utils.md) | 类型定义 + YAML 工具函数模式 |

## 新资源页面开发检查清单

1. [ ] `src/types/{resource}/index.ts` — 类型定义
2. [ ] `src/utils/{resource}.ts` — 工具函数（createEmpty, normalize, toYaml, fromYaml）
3. [ ] `src/schemas/{resource}/` — Zod 验证 Schema（可选，复杂表单需要）
4. [ ] `src/components/ResourceEditor/{Resource}/{Resource}Editor.tsx` — 编辑器 Modal
5. [ ] `src/components/ResourceEditor/{Resource}/{Resource}Form.tsx` — 表单
6. [ ] `src/components/ResourceEditor/{Resource}/sections/` — 表单区段（按需）
7. [ ] `src/pages/{Category}/{Resource}List.tsx` — 列表页
8. [ ] `src/App.tsx` — 添加路由
9. [ ] `src/components/Layout/MainLayout.tsx` — 菜单项（如果需要新增）
10. [ ] `src/api/types.ts` — ResourceKind 枚举（如果新增 kind）
