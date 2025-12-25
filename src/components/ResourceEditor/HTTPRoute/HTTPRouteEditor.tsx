/**
 * HTTPRoute 主编辑器
 * 支持表单模式和 YAML 模式切换，带双向同步
 */

import React, { useState, useEffect } from 'react';
import { Modal, Tabs, Button, Space, message } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import HTTPRouteForm from './HTTPRouteForm';
import YamlEditor from '@/components/YamlEditor';
import { resourceApi } from '@/api/resources';
import { httpRouteSchema } from '@/schemas/gateway-api';
import {
  createEmptyHTTPRoute,
  normalizeHTTPRoute,
  httpRouteToYAML,
  yamlToHTTPRoute,
  DEFAULT_HTTPROUTE_YAML,
} from '@/utils/httproute';
import type { HTTPRoute } from '@/types/gateway-api';

const { TabPane } = Tabs;

interface HTTPRouteEditorProps {
  visible: boolean;
  mode: 'create' | 'edit' | 'view';
  resource?: HTTPRoute | null;
  onClose: () => void;
}

const HTTPRouteEditor: React.FC<HTTPRouteEditorProps> = ({
  visible,
  mode: initialMode,
  resource,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'yaml'>('form');
  const [formData, setFormData] = useState<HTTPRoute | null>(null);
  const [yamlContent, setYamlContent] = useState<string>('');
  const [isReadOnly, setIsReadOnly] = useState(initialMode === 'view');
  const queryClient = useQueryClient();

  // 初始化数据
  useEffect(() => {
    if (visible) {
      if (resource) {
        // 编辑/查看模式：使用现有资源
        const normalized = normalizeHTTPRoute(resource);
        setFormData(normalized);
        setYamlContent(httpRouteToYAML(normalized));
      } else {
        // 创建模式：使用空模板
        const emptyRoute = createEmptyHTTPRoute();
        setFormData(emptyRoute);
        setYamlContent(DEFAULT_HTTPROUTE_YAML);
      }
      setIsReadOnly(initialMode === 'view');
      setActiveTab('form');
    }
  }, [visible, initialMode, resource]);

  // 表单 → YAML 同步
  const handleFormChange = (newFormData: HTTPRoute) => {
    setFormData(newFormData);
    try {
      const normalized = normalizeHTTPRoute(newFormData);
      const yaml = httpRouteToYAML(normalized);
      setYamlContent(yaml);
    } catch (e: any) {
      console.error('Form to YAML conversion error:', e);
    }
  };

  // YAML → 表单同步
  const handleYamlChange = (newYaml: string) => {
    setYamlContent(newYaml);
    try {
      const parsed = yamlToHTTPRoute(newYaml);
      // Zod 验证（静默）
      const validated = httpRouteSchema.safeParse(parsed);
      if (validated.success) {
        setFormData(validated.data);
      }
    } catch (e: any) {
      console.error('YAML parse error:', e);
      // YAML 格式错误，不更新表单
    }
  };

  // 创建 Mutation
  const createMutation = useMutation({
    mutationFn: ({ namespace, name, content }: { namespace: string; name: string; content: string }) =>
      resourceApi.create('httproute', namespace, content),
    onSuccess: () => {
      message.success('创建成功 / Created successfully');
      queryClient.invalidateQueries({ queryKey: ['httproutes'] });
      onClose();
    },
    onError: (error: any) => {
      message.error(`创建失败 / Create failed: ${error.message}`);
    },
  });

  // 更新 Mutation
  const updateMutation = useMutation({
    mutationFn: ({ namespace, name, content }: { namespace: string; name: string; content: string }) =>
      resourceApi.update('httproute', namespace, name, content),
    onSuccess: () => {
      message.success('更新成功 / Updated successfully');
      queryClient.invalidateQueries({ queryKey: ['httproutes'] });
      onClose();
    },
    onError: (error: any) => {
      message.error(`更新失败 / Update failed: ${error.message}`);
    },
  });

  // 提交处理
  const handleSubmit = async () => {
    try {
      let contentToSubmit: string;
      let parsedResource: HTTPRoute;

      if (activeTab === 'form') {
        // 表单模式：验证表单数据
        if (!formData) {
          message.error('表单数据为空 / Form data is empty');
          return;
        }
        
        // Zod 验证
        const validated = httpRouteSchema.parse(formData);
        parsedResource = validated;
        contentToSubmit = httpRouteToYAML(validated);
      } else {
        // YAML 模式：解析并验证 YAML
        parsedResource = yamlToHTTPRoute(yamlContent);
        const validated = httpRouteSchema.parse(parsedResource);
        contentToSubmit = httpRouteToYAML(validated);
      }

      const name = parsedResource.metadata?.name;
      const namespace = parsedResource.metadata?.namespace;

      if (!name || !namespace) {
        message.error('YAML 中必须包含 metadata.name 和 metadata.namespace');
        return;
      }

      if (initialMode === 'create') {
        createMutation.mutate({ namespace, name, content: contentToSubmit });
      } else if (resource) {
        if (name !== resource.metadata.name || namespace !== resource.metadata.namespace) {
          message.error('不允许修改资源的名称或命名空间 / Cannot modify resource name or namespace');
          return;
        }
        updateMutation.mutate({ namespace, name, content: contentToSubmit });
      }
    } catch (e: any) {
      if (e.issues && Array.isArray(e.issues)) {
        // Zod 验证错误
        const errors = e.issues.map((issue: any) => issue.message).join('; ');
        message.error(`验证失败 / Validation failed: ${errors}`);
      } else {
        message.error(`提交失败 / Submit failed: ${e.message || '未知错误'}`);
      }
    }
  };

  const title =
    initialMode === 'create'
      ? '创建 HTTPRoute / Create HTTPRoute'
      : initialMode === 'edit'
      ? `编辑 ${resource?.metadata.name} / Edit ${resource?.metadata.name}`
      : `查看 ${resource?.metadata.name} / View ${resource?.metadata.name}`;

  const footer = (
    <Space>
      {initialMode === 'view' && (
        <Button
          type="primary"
          onClick={() => {
            setIsReadOnly(false);
          }}
        >
          编辑 / Edit
        </Button>
      )}
      <Button onClick={onClose}>取消 / Cancel</Button>
      {!isReadOnly && (
        <Button
          type="primary"
          onClick={handleSubmit}
          loading={createMutation.isPending || updateMutation.isPending}
        >
          {initialMode === 'create' ? '创建 / Create' : '保存 / Save'}
        </Button>
      )}
    </Space>
  );

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onClose}
      footer={footer}
      width={1000}
      destroyOnClose
      style={{ top: 20 }}
    >
      <Tabs activeKey={activeTab} onChange={(key) => setActiveTab(key as 'form' | 'yaml')}>
        <TabPane tab="表单模式 / Form" key="form">
          {formData && (
            <HTTPRouteForm
              value={formData}
              onChange={handleFormChange}
              disabled={isReadOnly}
              isCreate={initialMode === 'create'}
            />
          )}
        </TabPane>
        <TabPane tab="YAML 模式 / YAML" key="yaml">
          <YamlEditor
            value={yamlContent}
            onChange={handleYamlChange}
            readOnly={isReadOnly}
            height="65vh"
          />
        </TabPane>
      </Tabs>
    </Modal>
  );
};

export default HTTPRouteEditor;

