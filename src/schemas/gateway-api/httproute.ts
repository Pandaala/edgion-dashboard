/**
 * HTTPRoute Zod Schema 验证
 */

import { z } from 'zod';
import {
  dns1123SubdomainSchema,
  hostnameSchema,
  portSchema,
  k8sObjectMetaSchema,
  parentReferenceSchema,
  backendRefSchema,
  backendObjectReferenceSchema,
  localObjectReferenceSchema,
  httpHeaderSchema,
} from './common';
import {
  PATH_MATCH_TYPES,
  HEADER_MATCH_TYPES,
  PATH_MODIFIER_TYPES,
  HTTP_FILTER_TYPES,
  HTTP_METHODS,
  HTTP_SCHEMES,
  REDIRECT_STATUS_CODES,
  VALIDATION_MESSAGES,
} from '@/constants/gateway-api';

// ============================================
// HTTPRoute Match Schema
// ============================================

/**
 * HTTPPathMatch Schema
 */
export const httpPathMatchSchema = z.object({
  type: z.enum(PATH_MATCH_TYPES as [string, ...string[]]).optional(),
  value: z.string().optional(),
});

/**
 * HTTPHeaderMatch Schema
 */
export const httpHeaderMatchSchema = z.object({
  type: z.enum(HEADER_MATCH_TYPES as [string, ...string[]]).optional(),
  name: z.string().min(1, VALIDATION_MESSAGES.required.zh),
  value: z.string(),
});

/**
 * HTTPQueryParamMatch Schema
 */
export const httpQueryParamMatchSchema = z.object({
  type: z.enum(HEADER_MATCH_TYPES as [string, ...string[]]).optional(),
  name: z.string().min(1, VALIDATION_MESSAGES.required.zh),
  value: z.string(),
});

/**
 * HTTPRouteMatch Schema
 */
export const httpRouteMatchSchema = z.object({
  path: httpPathMatchSchema.optional(),
  headers: z.array(httpHeaderMatchSchema).optional(),
  queryParams: z.array(httpQueryParamMatchSchema).optional(),
  method: z.enum(HTTP_METHODS as [string, ...string[]]).optional(),
});

// ============================================
// HTTPRoute Filter Schema
// ============================================

/**
 * HTTPRequestHeaderFilter Schema
 */
export const httpRequestHeaderFilterSchema = z.object({
  set: z.array(httpHeaderSchema).optional(),
  add: z.array(httpHeaderSchema).optional(),
  remove: z.array(z.string()).optional(),
});

/**
 * HTTPPathModifier Schema
 */
export const httpPathModifierSchema = z.object({
  type: z.enum(PATH_MODIFIER_TYPES as [string, ...string[]]),
  replaceFullPath: z.string().optional(),
  replacePrefixMatch: z.string().optional(),
});

/**
 * HTTPRequestRedirectFilter Schema
 */
export const httpRequestRedirectFilterSchema = z.object({
  scheme: z.enum(HTTP_SCHEMES as [string, ...string[]]).optional(),
  hostname: hostnameSchema.optional(),
  path: httpPathModifierSchema.optional(),
  port: portSchema.optional(),
  statusCode: z.union([z.literal(301), z.literal(302)]).optional(),
});

/**
 * HTTPURLRewriteFilter Schema
 */
export const httpURLRewriteFilterSchema = z.object({
  hostname: hostnameSchema.optional(),
  path: httpPathModifierSchema.optional(),
});

/**
 * HTTPRequestMirrorFilter Schema
 */
export const httpRequestMirrorFilterSchema = z.object({
  backendRef: backendObjectReferenceSchema,
});

/**
 * HTTPRouteFilter Schema
 */
export const httpRouteFilterSchema = z.object({
  type: z.enum(HTTP_FILTER_TYPES as [string, ...string[]]),
  requestHeaderModifier: httpRequestHeaderFilterSchema.optional(),
  responseHeaderModifier: httpRequestHeaderFilterSchema.optional(),
  requestRedirect: httpRequestRedirectFilterSchema.optional(),
  urlRewrite: httpURLRewriteFilterSchema.optional(),
  requestMirror: httpRequestMirrorFilterSchema.optional(),
  extensionRef: localObjectReferenceSchema.optional(),
});

// ============================================
// HTTPRoute Timeouts Schema
// ============================================

/**
 * HTTPRouteTimeouts Schema
 */
export const httpRouteTimeoutsSchema = z.object({
  request: z.string().optional(),
  backendRequest: z.string().optional(),
});

// ============================================
// HTTPRoute Rule Schema
// ============================================

/**
 * HTTPRouteRule Schema
 */
export const httpRouteRuleSchema = z.object({
  matches: z.array(httpRouteMatchSchema).optional(),
  filters: z.array(httpRouteFilterSchema).optional(),
  backendRefs: z.array(backendRefSchema).optional(),
  timeouts: httpRouteTimeoutsSchema.optional(),
});

// ============================================
// HTTPRoute Spec Schema
// ============================================

/**
 * HTTPRouteSpec Schema
 */
export const httpRouteSpecSchema = z.object({
  parentRefs: z
    .array(parentReferenceSchema)
    .min(1, VALIDATION_MESSAGES.minItems(1).zh),
  hostnames: z.array(hostnameSchema).optional(),
  rules: z.array(httpRouteRuleSchema).optional(),
});

// ============================================
// HTTPRoute Schema
// ============================================

/**
 * HTTPRoute 完整 Schema
 */
export const httpRouteSchema = z.object({
  apiVersion: z.literal('gateway.networking.k8s.io/v1'),
  kind: z.literal('HTTPRoute'),
  metadata: k8sObjectMetaSchema,
  spec: httpRouteSpecSchema,
  status: z.any().optional(),
});

/**
 * HTTPRoute 类型（从 Schema 推导）
 */
export type HTTPRouteSchemaType = z.infer<typeof httpRouteSchema>;

