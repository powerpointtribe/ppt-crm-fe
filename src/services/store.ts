import { apiService } from './api'

export interface ProductVariant {
  _id?: string
  size: string
  colour: string
  stock: number
  additionalPrice?: number
  images?: string[]
}

export interface Product {
  _id: string
  name: string
  slug: string
  description?: string
  price: number
  currency: string
  images: string[]
  variants: ProductVariant[]
  isActive: boolean
  isFeatured: boolean
  tags?: string[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  product: string
  productName: string
  size?: string
  colour?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  images?: string[]
}

export interface DeliveryInfo {
  fullName: string
  phone: string
  email?: string
  address: string
  city?: string
  state?: string
  notes?: string
}

export interface Order {
  _id: string
  orderNumber: string
  items: OrderItem[]
  delivery: DeliveryInfo
  subtotal: number
  discountAmount: number
  totalAmount: number
  currency: string
  status: string
  paymentStatus: string
  flutterwaveRef?: string
  flutterwaveTransactionId?: string
  customerEmail?: string
  customerPhone?: string
  createdAt: string
  updatedAt: string
}

export interface Coupon {
  _id: string
  code: string
  description?: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  maxDiscountAmount?: number
  minOrderAmount?: number
  expiresAt?: string
  usageCount: number
  usageLimit?: number
  applicableProducts?: string[]
  isActive: boolean
  createdAt: string
}

interface PaginatedResponse<T> {
  success: boolean
  data: {
    data: T[]
    total: number
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

interface SingleResponse<T> {
  success: boolean
  data: T
  message: string
}

// ─── Admin: Products ────────────────────────────────────────────

export async function getProducts(params?: Record<string, any>) {
  const res = await apiService.get<PaginatedResponse<Product>>('/store/products', { params })
  return res.data
}

export async function getProductById(id: string) {
  const res = await apiService.get<SingleResponse<Product>>(`/store/products/${id}`)
  return res.data
}

export async function createProduct(data: Partial<Product>) {
  const res = await apiService.post<SingleResponse<Product>>('/store/products', data)
  return res.data
}

export async function updateProduct(id: string, data: Partial<Product>) {
  const res = await apiService.patch<SingleResponse<Product>>(`/store/products/${id}`, data)
  return res.data
}

export async function deleteProduct(id: string) {
  return apiService.delete(`/store/products/${id}`)
}

// ─── Admin: Orders ──────────────────────────────────────────────

export async function getOrders(params?: Record<string, any>) {
  const res = await apiService.get<PaginatedResponse<Order>>('/store/orders', { params })
  return res.data
}

export async function getOrderById(id: string) {
  const res = await apiService.get<SingleResponse<Order>>(`/store/orders/${id}`)
  return res.data
}

export async function updateOrderStatus(id: string, data: { status: string }) {
  const res = await apiService.patch<SingleResponse<Order>>(`/store/orders/${id}`, data)
  return res.data
}

export async function getOrderStats() {
  const res = await apiService.get<SingleResponse<any>>('/store/orders/stats')
  return res.data
}

export async function bulkUpdateOrderStatus(orders: { orderNumber: string; status: string }[]) {
  const res = await apiService.patch<SingleResponse<{ updated: number; skipped: number; errors: string[] }>>(
    '/store/orders/bulk-status',
    { orders },
  )
  return res.data
}

// ─── Admin: Coupons ─────────────────────────────────────────────

export async function getCoupons(params?: Record<string, any>) {
  const res = await apiService.get<PaginatedResponse<Coupon>>('/store/coupons', { params })
  return res.data
}

export async function createCoupon(data: Partial<Coupon>) {
  const res = await apiService.post<SingleResponse<Coupon>>('/store/coupons', data)
  return res.data
}

export async function updateCoupon(id: string, data: Partial<Coupon>) {
  const res = await apiService.patch<SingleResponse<Coupon>>(`/store/coupons/${id}`, data)
  return res.data
}

export async function deleteCoupon(id: string) {
  return apiService.delete(`/store/coupons/${id}`)
}

// ─── Public ─────────────────────────────────────────────────────

export async function getActiveProducts() {
  const res = await apiService.get<SingleResponse<Product[]>>('/store/public/products')
  return res.data
}

export async function getProductBySlug(slug: string) {
  const res = await apiService.get<SingleResponse<Product>>(`/store/public/products/${slug}`)
  return res.data
}

export async function createOrder(data: {
  items: { product: string; size?: string; colour?: string; quantity: number }[]
  delivery: DeliveryInfo
  couponCode?: string
  customerEmail?: string
  customerPhone?: string
}) {
  const res = await apiService.post<SingleResponse<Order>>('/store/public/orders', data)
  return res.data
}

export async function initiatePayment(orderId: string) {
  const res = await apiService.post<SingleResponse<{ paymentLink: string; txRef: string }>>(
    `/store/public/orders/${orderId}/pay`,
  )
  return res.data
}

export async function getOrderStatus(orderNumber: string) {
  const res = await apiService.get<SingleResponse<any>>(
    `/store/public/orders/${orderNumber}/status`,
  )
  return res.data
}

export async function verifyPayment(transactionId: string) {
  const res = await apiService.get<SingleResponse<any>>('/store/public/payment/verify', {
    params: { transaction_id: transactionId },
  })
  return res.data
}

export async function verifyOrderPayment(orderId: string) {
  const res = await apiService.post<SingleResponse<any>>(`/store/orders/${orderId}/verify-payment`)
  return res.data
}

export async function validateCoupon(code: string, subtotal: number, productIds: string[]) {
  const res = await apiService.post<SingleResponse<{
    code: string
    discountType: string
    discountValue: number
    discountAmount: number
  }>>('/store/public/validate-coupon', { code, subtotal, productIds })
  return res.data
}
