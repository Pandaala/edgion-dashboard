---
name: api-layer
description: Edgion Dashboard API 层设计——Axios 客户端、resourceApi/clusterResourceApi、错误处理
---

# API 层设计

## 双 API 客户端

根据资源 Scope 选择：

### resourceApi（命名空间资源）

```typescript
// 路径模式: /api/v1/namespaced/{kind}/{namespace}/{name}
resourceApi.listAll<T>(kind)                    // GET /namespaced/{kind}
resourceApi.list<T>(kind, namespace)            // GET /namespaced/{kind}/{namespace}
resourceApi.get<T>(kind, namespace, name)       // GET /namespaced/{kind}/{ns}/{name}
resourceApi.create<T>(kind, namespace, resource) // POST + Content-Type: application/yaml
resourceApi.update<T>(kind, namespace, name, resource) // PUT + Content-Type: application/yaml
resourceApi.delete(kind, namespace, name)       // DELETE
resourceApi.batchDelete(kind, resources[])      // 并行 DELETE
```

### clusterResourceApi（集群级资源）

```typescript
// 路径模式: /api/v1/cluster/{kind}/{name}
clusterResourceApi.listAll<T>(kind)            // GET /cluster/{kind}
clusterResourceApi.get<T>(kind, name)          // GET /cluster/{kind}/{name}
clusterResourceApi.create<T>(kind, resource)    // POST
clusterResourceApi.update<T>(kind, name, resource) // PUT
clusterResourceApi.delete(kind, name)          // DELETE
```

## ResourceKind 类型

在 `src/api/types.ts` 中定义，新增资源时需要在这里添加新的 kind 值：

```typescript
export type ResourceKind =
  | 'httproute' | 'grpcroute' | 'tcproute' | 'udproute' | 'tlsroute'
  | 'service' | 'endpointslice'
  | 'edgiontls' | 'edgionplugins' | 'pluginmetadata' | 'linksys'
  | 'secret' | 'gatewayclass' | 'edgiongatewayconfig' | 'gateway'
```

## YAML 序列化约定

创建和更新操作发送 YAML 格式：
- `resourceApi.create/update` 接受 `T | string`
- 如果传入对象，内部用 `yaml.dump()` 序列化
- 请求头设置 `Content-Type: application/yaml`

## 错误处理

Axios 拦截器自动处理常见错误码：
- 409 Conflict → 资源已存在
- 404 Not Found → 资源不存在
- 400 Bad Request → 请求参数错误（显示后端 message）
- 500/503 → 服务器错误
- 所有错误通过 `message.error()` 展示

## React Query 集成模式

```typescript
// 列表页查询
const { data, isLoading, refetch } = useQuery({
  queryKey: [kind],
  queryFn: () => resourceApi.listAll<T>(kind),
})

// 创建/更新 Mutation
const createMutation = useMutation({
  mutationFn: ({ namespace, yamlContent }: { namespace: string; yamlContent: string }) =>
    resourceApi.create(kind, namespace, yamlContent),
  onSuccess: () => {
    message.success('创建成功')
    queryClient.invalidateQueries({ queryKey: [kind] })
  },
})
```
