# Edgion Controller — AI Agent 项目指令

## 项目概要

Edgion Controller 是 Edgion 网关的前端管理界面，基于 React 18 + TypeScript + Ant Design 5 + Vite 5。
通过 REST API 与 Edgion Controller（端口 5800）交互，管理 Gateway API 资源和 Edgion 自定义资源。

**技术栈**：React 18、TypeScript 5、Ant Design 5、Vite 5、React Router 6、React Query 5、Monaco Editor、Zod 验证、Axios。

**开发服务器**：`npm run dev`（端口 5173，自动代理 `/api` 到 `localhost:5800`）。

## 知识体系

当任务需要项目上下文时，从 `skills/SKILL.md` 开始，**按需渐进加载**，不要一次全部读取。

### Skills 导航规则

1. **渐进式加载**：`skills/SKILL.md` → 分类 SKILL.md → 具体文件。只加载当前任务需要的最小子树。
2. **三层定位**：
   - **理解架构** → `01-architecture/` — 项目结构、数据流、API 层
   - **组件模式** → `02-patterns/` — 列表页、编辑器、表单、YAML 模式
   - **资源开发** → `03-resources/` — 每种资源的开发指南和 Schema
3. **新资源页面**：先到 `02-patterns/` 理解现有模式，再到 `03-resources/` 找目标资源的 Schema，最后参考已完成的 HTTPRoute/EdgionPlugins 实现。

## 核心开发模式

### 新增资源管理页面（标准流程）

每种新资源都遵循 HTTPRoute 和 EdgionPlugins 建立的模式：

1. **类型定义** `src/types/{resource}/index.ts`
   - TypeScript 接口，匹配后端 YAML Schema
   - 导出主类型和子类型

2. **工具函数** `src/utils/{resource}.ts`
   - `createEmpty{Resource}()` — 创建空对象
   - `normalize{Resource}(raw)` — 规范化后端返回数据
   - `{resource}ToYaml(obj)` — 对象转 YAML
   - `yamlTo{Resource}(str)` — YAML 转对象
   - 计数/统计辅助函数

3. **编辑器组件** `src/components/ResourceEditor/{Resource}/`
   - `{Resource}Editor.tsx` — Modal 容器（Form/YAML 双标签）
   - `{Resource}Form.tsx` — 表单容器
   - `sections/` — 按功能分拆的表单区段

4. **列表页面** `src/pages/{Category}/{Resource}List.tsx`
   - Ant Design Table + 搜索 + 批量操作
   - React Query `useQuery` 获取数据
   - `useMutation` 处理 CRUD

5. **路由注册** `src/App.tsx`
   - 添加 `<Route>` 元素

### API 调用约定

- 命名空间资源：`resourceApi`（`src/api/resources.ts`）
- 集群级资源：`clusterResourceApi`
- Content-Type: `application/yaml`（创建/更新）
- React Query staleTime: 5 分钟

### 验证约定

- Zod Schema 在 `src/schemas/` 下
- 表单提交前用 Zod 验证
- DNS-1123 子域名、主机名等复用 `src/constants/gateway-api.ts` 中的正则

## 资源 Scope 速查

| 资源 | Scope | API | Kind 值 | apiVersion |
|------|-------|-----|---------|-----------|
| HTTPRoute | namespaced | resourceApi | `httproute` | gateway.networking.k8s.io/v1 |
| GRPCRoute | namespaced | resourceApi | `grpcroute` | gateway.networking.k8s.io/v1 |
| TCPRoute | namespaced | resourceApi | `tcproute` | gateway.networking.k8s.io/v1alpha2 |
| UDPRoute | namespaced | resourceApi | `udproute` | gateway.networking.k8s.io/v1alpha2 |
| TLSRoute | namespaced | resourceApi | `tlsroute` | gateway.networking.k8s.io/v1 |
| Gateway | namespaced | resourceApi | `gateway` | gateway.networking.k8s.io/v1 |
| GatewayClass | cluster | clusterResourceApi | `gatewayclass` | gateway.networking.k8s.io/v1 |
| Service | namespaced | resourceApi | `service` | v1 |
| EndpointSlice | namespaced | resourceApi | `endpointslice` | discovery.k8s.io/v1 |
| EdgionPlugins | namespaced | resourceApi | `edgionplugins` | edgion.io/v1 |
| EdgionStreamPlugins | namespaced | resourceApi | `edgionstreamplugins` | edgion.io/v1 |
| EdgionTls | namespaced | resourceApi | `edgiontls` | edgion.io/v1 |
| EdgionGatewayConfig | cluster | clusterResourceApi | `edgiongatewayconfig` | edgion.io/v1alpha1 |
| PluginMetaData | namespaced | resourceApi | `pluginmetadata` | edgion.io/v1 |
| Secret | namespaced | resourceApi | `secret` | v1 |
| BackendTLSPolicy | namespaced | resourceApi | `backendtlspolicy` | gateway.networking.k8s.io/v1alpha3 |
| ReferenceGrant | namespaced | resourceApi | `referencegrant` | gateway.networking.k8s.io/v1 |
| LinkSys | namespaced | resourceApi | `linksys` | edgion.io/v1 |
| EdgionAcme | namespaced | resourceApi | `edgionacme` | edgion.io/v1 |

**注意**：`edgionstreamplugins`、`referencegrant`、`edgionacme` 需要添加到 `src/api/types.ts` 的 ResourceKind 类型中。

### API 响应格式（feature-04-06 统一）

```typescript
// 标准响应
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// 列表响应（新增 continue_token 分页支持）
interface ListResponse<T> {
  success: boolean
  data?: T[]
  count: number
  continue_token?: string  // 分页令牌
  error?: string
}
```

### Controller API 端点

```
GET  /health                                    # 存活检查
GET  /ready                                     # 就绪检查
GET  /api/v1/server-info                        # 服务器信息
POST /api/v1/reload                             # 重新加载所有资源
GET  /api/v1/namespaced/{kind}                  # 列出所有命名空间资源
GET  /api/v1/namespaced/{kind}/{namespace}      # 列出指定命名空间资源
*    /api/v1/namespaced/{kind}/{ns}/{name}      # 单个资源 CRUD
GET  /api/v1/cluster/{kind}                     # 列出集群级资源
*    /api/v1/cluster/{kind}/{name}              # 单个集群资源 CRUD
POST /api/v1/services/acme/{ns}/{name}/trigger  # 手动触发 ACME 签发
```

## 常用命令

```bash
# 开发
npm run dev              # 启动开发服务器 (port 5173)
npm run build            # TypeScript 编译 + Vite 构建
npm run lint             # ESLint 检查
npm run preview          # 预览生产构建

# 后端测试环境（在 edgion 项目目录下执行）
cd ../edgion
./examples/test/scripts/utils/start_all_with_conf.sh    # 启动 Controller + Gateway
./examples/test/scripts/utils/load_conf.sh all           # 加载全部测试数据
# Controller Admin API: http://localhost:5800
# Gateway Admin API: http://localhost:5900
```

## 目录结构

```
src/
├── api/                  # HTTP 客户端层（Axios + 通用 CRUD）
├── components/
│   ├── Layout/           # MainLayout 主布局
│   ├── ResourceEditor/   # 资源编辑器（按资源类型分目录）
│   └── YamlEditor/       # Monaco YAML 编辑器
├── constants/            # 常量、枚举、正则、默认值
├── pages/                # 页面组件（按功能分类）
│   ├── Dashboard/
│   ├── Routes/           # HTTPRoute, GRPCRoute, ...
│   └── Plugins/          # EdgionPlugins, ...
├── schemas/              # Zod 验证 Schema
├── types/                # TypeScript 类型定义
│   ├── gateway-api/      # Gateway API 标准资源类型
│   └── edgion-plugins/   # Edgion 自定义资源类型
├── utils/                # 工具函数（YAML 转换、验证等）
├── App.tsx               # 路由定义
└── main.tsx              # 入口（React/Router/Query/Ant Design）
```

## 编码规范

- 组件文件用 PascalCase，工具文件用 camelCase
- 列表页命名：`{Resource}List.tsx`，编辑器命名：`{Resource}Editor.tsx`
- 新组件参考 HTTPRouteList / HTTPRouteEditor 的模式
- 使用 Ant Design 组件，不引入额外 UI 库
- 中文 UI 文本（后续 i18n 统一处理）
- 类型定义单独文件，不内联在组件中
