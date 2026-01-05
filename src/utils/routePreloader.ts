import { lazy, ComponentType } from 'react'

type LazyComponent = () => Promise<{ default: ComponentType<any> }>

// Route to component mapping for preloading
const routeComponents: Record<string, LazyComponent> = {
  // Dashboard
  '/dashboard': () => import('@/pages/Dashboard'),

  // Members
  '/members': () => import('@/pages/Members/Members'),
  '/members/new': () => import('@/pages/Members/MemberNew'),
  '/members/analytics': () => import('@/pages/Members/MemberAnalytics'),
  '/members/reports': () => import('@/pages/Members/MemberReports'),

  // First Timers
  '/first-timers': () => import('@/pages/FirstTimers/FirstTimers'),
  '/first-timers/new': () => import('@/pages/FirstTimers/FirstTimerNew'),
  '/first-timers/call-reports': () => import('@/pages/FirstTimers/CallReports'),
  '/first-timers/reports': () => import('@/pages/FirstTimers/FirstTimerReports'),
  '/first-timers/message-drafts': () => import('@/pages/FirstTimers/MessageDrafts'),

  // Groups
  '/groups': () => import('@/pages/Groups/Groups'),
  '/groups/new': () => import('@/pages/Groups/GroupNew'),

  // Service Reports
  '/members/service-reports': () => import('@/pages/ServiceReports/ServiceReports'),
  '/members/service-reports/new': () => import('@/pages/ServiceReports/ServiceReportNew'),

  // Finance
  '/finance': () => import('@/pages/Finance/FinanceDashboard'),
  '/finance/requisitions': () => import('@/pages/Finance/RequisitionsList'),
  '/finance/requisitions/new': () => import('@/pages/Finance/RequisitionNew'),
  '/finance/approvals': () => import('@/pages/Finance/PendingApprovals'),
  '/finance/disbursements': () => import('@/pages/Finance/PendingDisbursements'),
  '/finance/settings/form-fields': () => import('@/pages/Finance/FormFieldsSettings'),

  // Settings
  '/settings': () => import('@/pages/Settings'),
  '/my-settings': () => import('@/pages/UserSettings'),

  // Workers Training
  '/workers-training': () => import('@/pages/WorkersTraining/WorkersTraining'),
  '/workers-training/cohorts': () => import('@/pages/WorkersTraining/CohortManagement'),

  // Inventory
  '/inventory': () => import('@/pages/Inventory/InventoryDashboard'),
  '/inventory/items': () => import('@/pages/Inventory/InventoryItems'),

  // Audit
  '/audit': () => import('@/pages/Audit/AuditDashboard'),
  '/audit/logs': () => import('@/pages/Audit/AuditLogs'),

  // Roles
  '/roles': () => import('@/pages/roles').then(m => ({ default: m.RolesListPage })),

  // Branches
  '/branches': () => import('@/pages/Branches').then(m => ({ default: m.Branches })),

  // Bulk Operations
  '/bulk-operations': () => import('@/pages/BulkOperations/BulkOperationsDashboard'),

  // User Management
  '/user-management': () => import('@/pages/UserManagement'),

  // Analytics
  '/analytics': () => import('@/pages/Reports/Analytics'),
}

// Cache for preloaded components
const preloadedRoutes = new Set<string>()
const componentCache = new Map<string, Promise<any>>()

class RoutePreloader {
  preload(path: string): void {
    // Normalize path (remove trailing slash, query params)
    const normalizedPath = this.normalizePath(path)

    // Check if already preloaded
    if (preloadedRoutes.has(normalizedPath)) {
      return
    }

    // Find matching route
    const loader = this.findLoader(normalizedPath)

    if (loader) {
      preloadedRoutes.add(normalizedPath)

      // Start loading the component
      const promise = loader()
      componentCache.set(normalizedPath, promise)

      // Log in development
      if (import.meta.env.DEV) {
        console.log(`[Preloader] Preloading: ${normalizedPath}`)
      }
    }
  }

  preloadMultiple(paths: string[]): void {
    paths.forEach(path => this.preload(path))
  }

  private normalizePath(path: string): string {
    // Remove query params and hash
    let normalized = path.split('?')[0].split('#')[0]

    // Remove trailing slash
    if (normalized.length > 1 && normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1)
    }

    // Handle dynamic segments (e.g., /members/123 -> /members/:id)
    // For now, just get the base path for dynamic routes
    const segments = normalized.split('/')
    if (segments.length >= 3) {
      // Check if last segment looks like an ID
      const lastSegment = segments[segments.length - 1]
      if (/^[a-f0-9]{24}$/.test(lastSegment) || /^\d+$/.test(lastSegment)) {
        // This is likely a detail page, try to preload it
        segments[segments.length - 1] = ':id'
      }
    }

    return normalized
  }

  private findLoader(path: string): LazyComponent | undefined {
    // Direct match
    if (routeComponents[path]) {
      return routeComponents[path]
    }

    // Try parent path for detail/edit pages
    const segments = path.split('/')
    while (segments.length > 1) {
      segments.pop()
      const parentPath = segments.join('/') || '/'
      if (routeComponents[parentPath]) {
        return routeComponents[parentPath]
      }
    }

    return undefined
  }

  isPreloaded(path: string): boolean {
    return preloadedRoutes.has(this.normalizePath(path))
  }

  getFromCache(path: string): Promise<any> | undefined {
    return componentCache.get(this.normalizePath(path))
  }
}

export const routePreloader = new RoutePreloader()

// Utility to create lazy components with preloading support
export function lazyWithPreload<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  const Component = lazy(factory)
  ;(Component as any).preload = factory
  return Component
}

// Preload common routes on app start
export function preloadCommonRoutes(): void {
  // Preload most visited routes after initial load
  setTimeout(() => {
    routePreloader.preloadMultiple([
      '/dashboard',
      '/members',
      '/first-timers',
      '/finance',
    ])
  }, 2000)
}
