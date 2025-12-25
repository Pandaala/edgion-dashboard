/**
 * Metadata Section - 基础信息
 * 包含 name, namespace, labels, annotations
 */

import React from 'react';
import { Card, Form, Input, Button, Space, Typography } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { DEFAULT_VALUES } from '@/constants/gateway-api';
import type { K8sObjectMeta } from '@/types/gateway-api';

const { Text } = Typography;

interface MetadataSectionProps {
  value?: K8sObjectMeta;
  onChange?: (value: K8sObjectMeta) => void;
  disabled?: boolean;
  isCreate?: boolean;
}

const MetadataSection: React.FC<MetadataSectionProps> = ({
  value = {
    name: '',
    namespace: DEFAULT_VALUES.defaultNamespace,
    labels: {},
    annotations: {},
  },
  onChange,
  disabled = false,
  isCreate = true,
}) => {
  const handleChange = (field: keyof K8sObjectMeta, fieldValue: any) => {
    onChange?.({ ...value, [field]: fieldValue });
  };

  const handleLabelChange = (key: string, labelValue: string, oldKey?: string) => {
    const newLabels = { ...(value.labels || {}) };
    if (oldKey && oldKey !== key) {
      delete newLabels[oldKey];
    }
    newLabels[key] = labelValue;
    handleChange('labels', newLabels);
  };

  const handleLabelRemove = (key: string) => {
    const newLabels = { ...(value.labels || {}) };
    delete newLabels[key];
    handleChange('labels', newLabels);
  };

  const handleAnnotationChange = (key: string, annotationValue: string, oldKey?: string) => {
    const newAnnotations = { ...(value.annotations || {}) };
    if (oldKey && oldKey !== key) {
      delete newAnnotations[oldKey];
    }
    newAnnotations[key] = annotationValue;
    handleChange('annotations', newAnnotations);
  };

  const handleAnnotationRemove = (key: string) => {
    const newAnnotations = { ...(value.annotations || {}) };
    delete newAnnotations[key];
    handleChange('annotations', newAnnotations);
  };

  return (
    <Card title="基础信息 / Basic Info" size="small">
      {/* 名称 */}
      <Form.Item
        label="名称 / Name"
        required
        rules={[{ required: true, message: '请输入资源名称' }]}
      >
        <Input
          value={value.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="example-route"
          disabled={disabled || !isCreate}
        />
      </Form.Item>

      {/* 命名空间 */}
      <Form.Item
        label="命名空间 / Namespace"
        required
        rules={[{ required: true, message: '请选择命名空间' }]}
      >
        <Input
          value={value.namespace}
          onChange={(e) => handleChange('namespace', e.target.value)}
          placeholder="default"
          disabled={disabled || !isCreate}
        />
      </Form.Item>

      {/* Labels */}
      <Form.Item label="Labels（可选）">
        {Object.entries(value.labels || {}).map(([key, labelValue]) => (
          <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
            <Input
              value={key}
              onChange={(e) => handleLabelChange(e.target.value, labelValue as string, key)}
              placeholder="key"
              disabled={disabled}
              style={{ width: 200 }}
            />
            <Text>:</Text>
            <Input
              value={labelValue as string}
              onChange={(e) => handleLabelChange(key, e.target.value)}
              placeholder="value"
              disabled={disabled}
              style={{ flex: 1 }}
            />
            {!disabled && (
              <Button
                type="text"
                danger
                icon={<MinusCircleOutlined />}
                onClick={() => handleLabelRemove(key)}
              />
            )}
          </Space>
        ))}
        {!disabled && (
          <Button
            type="dashed"
            onClick={() => handleLabelChange('new-key', '')}
            block
            icon={<PlusOutlined />}
          >
            添加 Label
          </Button>
        )}
      </Form.Item>

      {/* Annotations */}
      <Form.Item label="Annotations（可选）">
        {Object.entries(value.annotations || {}).map(([key, annotationValue]) => (
          <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
            <Input
              value={key}
              onChange={(e) => handleAnnotationChange(e.target.value, annotationValue as string, key)}
              placeholder="key"
              disabled={disabled}
              style={{ width: 200 }}
            />
            <Text>:</Text>
            <Input
              value={annotationValue as string}
              onChange={(e) => handleAnnotationChange(key, e.target.value)}
              placeholder="value"
              disabled={disabled}
              style={{ flex: 1 }}
            />
            {!disabled && (
              <Button
                type="text"
                danger
                icon={<MinusCircleOutlined />}
                onClick={() => handleAnnotationRemove(key)}
              />
            )}
          </Space>
        ))}
        {!disabled && (
          <Button
            type="dashed"
            onClick={() => handleAnnotationChange('new-key', '')}
            block
            icon={<PlusOutlined />}
          >
            添加 Annotation
          </Button>
        )}
      </Form.Item>
    </Card>
  );
};

export default MetadataSection;

