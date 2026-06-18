/**
 * 权限常量与标签定义（9 种细粒度权限）
 */

export const PERMISSIONS = {
  VIEW: 'view',
  UPLOAD: 'upload',
  EDIT_OWN: 'edit_own',
  EDIT_ALL: 'edit_all',
  DELETE_OWN: 'delete_own',
  DELETE_ALL: 'delete_all',
  FOLDER_CREATE: 'folder_create',
  FOLDER_MANAGE_ALL: 'folder_manage_all',
  MANAGE_USERS: 'manage_users',
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

export const PERMISSION_LABELS: Record<Permission, string> = {
  view: '查看文件',
  upload: '上传文件',
  edit_own: '编辑自己的文件',
  edit_all: '编辑所有文件',
  delete_own: '删除自己的文件',
  delete_all: '删除所有文件',
  folder_create: '创建文件夹',
  folder_manage_all: '管理所有文件夹',
  manage_users: '管理用户账号',
}

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS)

/** 普通用户默认权限 */
export const DEFAULT_USER_PERMISSIONS: Permission[] = [
  PERMISSIONS.VIEW,
  PERMISSIONS.UPLOAD,
  PERMISSIONS.EDIT_OWN,
  PERMISSIONS.DELETE_OWN,
  PERMISSIONS.FOLDER_CREATE,
]

/** 管理员默认权限（全部） */
export const DEFAULT_ADMIN_PERMISSIONS: Permission[] = [...ALL_PERMISSIONS]

export function hasPermission(userPermissions: string[], permission: Permission): boolean {
  return userPermissions.includes(permission)
}

/** 判断是否可编辑某文件（自己的用 edit_own，他人的需 edit_all） */
export function canEditFile(userPermissions: string[], isOwner: boolean): boolean {
  if (hasPermission(userPermissions, PERMISSIONS.EDIT_ALL)) return true
  return isOwner && hasPermission(userPermissions, PERMISSIONS.EDIT_OWN)
}

/** 判断是否可删除某文件 */
export function canDeleteFile(userPermissions: string[], isOwner: boolean): boolean {
  if (hasPermission(userPermissions, PERMISSIONS.DELETE_ALL)) return true
  return isOwner && hasPermission(userPermissions, PERMISSIONS.DELETE_OWN)
}
