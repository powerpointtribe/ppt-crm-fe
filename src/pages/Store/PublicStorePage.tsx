import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ShoppingCart, Minus, Plus, Tag, ChevronLeft, Check, X, Play, Pause } from 'lucide-react'
import {
  getProductBySlug, getActiveProducts, createOrder, initiatePayment,
  validateCoupon, type Product, type ProductVariant,
} from '@/services/store'
import { showToast } from '@/utils/toast'

if (!document.head.querySelector('[data-store-anim]')) {
  const s = document.createElement('style')
  s.setAttribute('data-store-anim', '')
  s.textContent = `
    @keyframes storeFadeIn { from { opacity: 0 } to { opacity: 1 } }
    @keyframes storeSlideDown { from { opacity:0; max-height:0 } to { opacity:1; max-height:2000px } }
  `
  document.head.appendChild(s)
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount)
}

interface CartItem {
  product: Product
  variant: ProductVariant
  quantity: number
}

interface VariantGroup {
  colour: string
  images: string[]
  sizes: { size: string; stock: number; variant: ProductVariant }[]
}

function groupVariantsByColour(variants: ProductVariant[]): VariantGroup[] {
  const groups: VariantGroup[] = []
  let current: VariantGroup | null = null
  for (const v of variants) {
    const startsNewGroup = !current || v.colour !== current.colour || (v.images?.length && current.sizes.length > 0)
    if (startsNewGroup) {
      current = { colour: v.colour, images: v.images?.length ? [...v.images] : [], sizes: [] }
      groups.push(current)
    }
    current!.sizes.push({ size: v.size, stock: v.stock, variant: v })
  }
  return groups
}

// ─── Product card for store listing ─────────────────────────────
function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const totalStock = product.variants.reduce((s, v) => s + v.stock, 0)
  const firstImage = product.variants.find(v => v.images?.length)?.images?.[0] || product.images?.[0]
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition group"
    >
      {firstImage ? (
        <div className="aspect-square overflow-hidden">
          <img src={firstImage} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
        </div>
      ) : (
        <div className="aspect-square bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
          <ShoppingCart className="w-12 h-12 text-indigo-300" />
        </div>
      )}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition">{product.name}</h3>
        {product.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>}
        <div className="flex items-center justify-between mt-3">
          <span className="text-lg font-bold text-indigo-600">{formatPrice(product.price)}</span>
          {totalStock === 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Sold Out</span>}
        </div>
      </div>
    </div>
  )
}

// ─── Image viewer with auto-play crossfade ──────────────────────
function ImageViewer({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0)
  const [playing, setPlaying] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const goTo = useCallback((i: number) => { setCurrent(i); setPlaying(false) }, [])

  const advance = useCallback(() => {
    setCurrent(prev => (prev + 1) % images.length)
  }, [images.length])

  useEffect(() => {
    if (playing && images.length > 1) {
      timer.current = setInterval(advance, 2500)
    }
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [playing, advance, images.length])

  useEffect(() => { setCurrent(0); setPlaying(false) }, [images])

  if (images.length === 0) return null

  return (
    <div className="space-y-1.5">
      <div className="relative aspect-square rounded-md overflow-hidden bg-gray-100">
        {/* Stack all images; only the current one is opaque */}
        {images.map((url, i) => (
          <img
            key={url}
            src={url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: i === current ? 1 : 0, transition: 'opacity 0.6s ease-in-out' }}
          />
        ))}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setPlaying(p => !p)}
              className="absolute bottom-2 right-2 z-10 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm transition"
            >
              {playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === current ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/70'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-1">
          {images.map((url, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`flex-1 aspect-square rounded overflow-hidden border-2 transition ${i === current ? 'border-indigo-500' : 'border-transparent hover:border-indigo-300'}`}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main component ─────────────────────────────────────────────
export default function PublicStorePage() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const [product, setProduct] = useState<Product | null>(null)
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)

  // Cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('store_cart')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [showCart, setShowCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)

  useEffect(() => { localStorage.setItem('store_cart', JSON.stringify(cart)) }, [cart])

  // Checkout
  const [couponCode, setCouponCode] = useState('')
  const [couponResult, setCouponResult] = useState<{ discountAmount: number; code: string } | null>(null)
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [delivery, setDelivery] = useState({ fullName: '', phone: '', email: '', address: '', city: '', state: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (slug) loadProduct(slug)
    else loadAllProducts()
  }, [slug])

  const loadProduct = async (s: string) => {
    try {
      setLoading(true)
      const p = await getProductBySlug(s)
      setProduct(p)
    } catch {
      showToast.error('Product not found')
      navigate('/store')
    } finally {
      setLoading(false)
    }
  }

  const loadAllProducts = async () => {
    try {
      setLoading(true)
      setAllProducts(await getActiveProducts())
    } catch {
      showToast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const variantGroups = useMemo(() =>
    product ? groupVariantsByColour(product.variants) : []
  , [product])

  const handleExpandVariant = (idx: number) => {
    if (expandedIndex === idx) {
      setExpandedIndex(null)
      return
    }
    setExpandedIndex(idx)
    const group = variantGroups[idx]
    if (group) {
      const avail = group.sizes.find(s => s.stock > 0)
      setSelectedSize(avail?.size || group.sizes[0]?.size || null)
    }
    setQuantity(1)
  }

  const expandedGroup = expandedIndex !== null ? variantGroups[expandedIndex] ?? null : null
  const selectedVariant = expandedGroup
    ? expandedGroup.sizes.find(s => s.size === selectedSize)?.variant || null
    : null

  // ─── Cart ─────────────────────────────────────────────────────
  const addToCart = () => {
    if (!product || !selectedVariant || selectedVariant.stock === 0) return
    setCart(prev => {
      const idx = prev.findIndex(
        c => c.product._id === product._id && c.variant.size === selectedVariant.size && c.variant.colour === selectedVariant.colour
      )
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + quantity }
        return updated
      }
      return [...prev, { product, variant: selectedVariant, quantity }]
    })
    showToast.success(`Added to cart`)
    setQuantity(1)
  }

  const removeFromCart = (index: number) => setCart(prev => prev.filter((_, i) => i !== index))

  const updateCartQuantity = (index: number, newQty: number) => {
    if (newQty < 1) return
    setCart(prev => { const u = [...prev]; u[index] = { ...u[index], quantity: newQty }; return u })
  }

  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  // ─── Checkout ─────────────────────────────────────────────────
  const handleValidateCoupon = async () => {
    if (!couponCode.trim() || cart.length === 0) return
    try {
      setValidatingCoupon(true)
      const productIds = [...new Set(cart.map(c => c.product._id))]
      const result = await validateCoupon(couponCode, cartSubtotal, productIds)
      setCouponResult({ discountAmount: result.discountAmount, code: result.code })
      showToast.success(`Coupon applied! ${formatPrice(result.discountAmount)} off`)
    } catch (err: any) {
      setCouponResult(null)
      showToast.error(err?.message || 'Invalid coupon')
    } finally {
      setValidatingCoupon(false)
    }
  }

  const discount = couponResult?.discountAmount || 0
  const total = cartSubtotal - discount

  const handleOrder = async () => {
    if (cart.length === 0) return
    if (!delivery.fullName.trim()) { showToast.error('Full name is required'); return }
    if (!delivery.email.trim()) { showToast.error('Email is required'); return }
    if (!delivery.phone.trim()) { showToast.error('Phone number is required'); return }
    if (!delivery.address.trim()) { showToast.error('Delivery address is required'); return }
    try {
      setSubmitting(true)
      const order = await createOrder({
        items: cart.map(c => ({
          product: c.product._id,
          size: c.variant.size,
          colour: c.variant.colour,
          quantity: c.quantity,
        })),
        delivery: {
          fullName: delivery.fullName.trim(),
          phone: delivery.phone.trim(),
          email: delivery.email.trim(),
          address: delivery.address.trim(),
          city: delivery.city.trim() || undefined,
          state: delivery.state.trim() || undefined,
          notes: delivery.notes.trim() || undefined,
        },
        couponCode: couponResult?.code,
        customerEmail: delivery.email.trim(),
        customerPhone: delivery.phone.trim(),
      })
      const payment = await initiatePayment(order._id)
      window.location.href = payment.paymentLink
    } catch (err: any) {
      showToast.error(err?.message || 'Failed to place order')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Cart drawer (shared) ─────────────────────────────────────
  function CartDrawer() {
    return (
      <div className="fixed inset-0 z-50 flex justify-end" style={{ animation: 'storeFadeIn .2s ease' }}>
        <div className="absolute inset-0 bg-black/50" onClick={() => { setShowCart(false); setShowCheckout(false) }} />
        <div className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-xl" style={{ animation: 'storeFadeIn .25s ease' }}>
          <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
            <h2 className="text-lg font-semibold">{showCheckout ? 'Checkout' : 'Your Cart'}</h2>
            <button onClick={() => { setShowCart(false); setShowCheckout(false) }} className="p-1 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {!showCheckout ? (
            <div className="p-4 space-y-4">
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Your cart is empty</p>
              ) : (
                <>
                  {cart.map((item, idx) => {
                    const img = item.variant.images?.[0] || item.product.images?.[0]
                    return (
                      <div key={idx} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                        {img && <img src={img} alt="" className="w-16 h-16 rounded-md object-cover flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{item.product.name}</p>
                          <p className="text-xs text-gray-500">{item.variant.size} / {item.variant.colour}</p>
                          <p className="text-sm font-semibold text-indigo-600 mt-1">{formatPrice(item.product.price)}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <button onClick={() => removeFromCart(idx)} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => updateCartQuantity(idx, item.quantity - 1)} className="p-0.5 border rounded hover:bg-gray-100"><Minus className="w-3 h-3" /></button>
                            <span className="text-sm font-medium w-5 text-center">{item.quantity}</span>
                            <button onClick={() => updateCartQuantity(idx, item.quantity + 1)} className="p-0.5 border rounded hover:bg-gray-100"><Plus className="w-3 h-3" /></button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div className="border-t pt-3 flex justify-between font-semibold text-gray-900">
                    <span>Subtotal</span><span>{formatPrice(cartSubtotal)}</span>
                  </div>
                  <button onClick={() => setShowCheckout(true)} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition">
                    Proceed to Checkout
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="p-4 space-y-5">
              <button onClick={() => setShowCheckout(false)} className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
                <ChevronLeft className="w-4 h-4" /> Back to cart
              </button>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.product.name} ({item.variant.size}/{item.variant.colour}) x{item.quantity}</span>
                    <span className="text-gray-900">{formatPrice(item.product.price * item.quantity)}</span>
                  </div>
                ))}
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Coupon: {couponResult?.code}</span><span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Total</span><span className="text-indigo-600">{formatPrice(total)}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Have a coupon?</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={couponCode} onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponResult(null) }}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg uppercase font-mono text-sm" placeholder="Enter code" />
                  </div>
                  <button onClick={handleValidateCoupon} disabled={validatingCoupon || !couponCode.trim()}
                    className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-50 disabled:opacity-50">
                    {validatingCoupon ? '...' : couponResult ? <Check className="w-4 h-4" /> : 'Apply'}
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Your Information</h3>
                <input type="text" value={delivery.fullName} onChange={(e) => setDelivery(d => ({ ...d, fullName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Full Name *" />
                <input type="email" value={delivery.email} onChange={(e) => setDelivery(d => ({ ...d, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Email Address *" />
                <input type="tel" value={delivery.phone} onChange={(e) => setDelivery(d => ({ ...d, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Phone Number *" />
                <h3 className="text-sm font-semibold text-gray-900 pt-1">Delivery Address</h3>
                <input type="text" value={delivery.address} onChange={(e) => setDelivery(d => ({ ...d, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Delivery Address *" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" value={delivery.city} onChange={(e) => setDelivery(d => ({ ...d, city: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="City" />
                  <input type="text" value={delivery.state} onChange={(e) => setDelivery(d => ({ ...d, state: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="State" />
                </div>
                <textarea value={delivery.notes} onChange={(e) => setDelivery(d => ({ ...d, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Delivery notes (optional)" rows={2} />
              </div>
              <button onClick={handleOrder} disabled={submitting}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50">
                {submitting ? 'Processing...' : `Pay ${formatPrice(total)}`}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    )
  }

  // ─── Store listing ────────────────────────────────────────────
  if (!slug) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Store</h1>
            {cartItemCount > 0 && (
              <button onClick={() => { setShowCart(true); setShowCheckout(false) }}
                className="relative flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                <ShoppingCart className="w-5 h-5" />Cart
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{cartItemCount}</span>
              </button>
            )}
          </div>
          {allProducts.length === 0 ? (
            <p className="text-center text-gray-500 py-12">No products available at the moment</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {allProducts.map(p => (
                <ProductCard key={p._id} product={p} onClick={() => navigate(`/store/${p.slug}`)} />
              ))}
            </div>
          )}
        </div>
        {(showCart || showCheckout) && <CartDrawer />}
      </div>
    )
  }

  if (!product) return null

  // ─── Single product page ──────────────────────────────────────
  const heroImage = product.images?.[0] || variantGroups[0]?.images?.[0]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Floating cart */}
      {cartItemCount > 0 && (
        <button onClick={() => { setShowCart(true); setShowCheckout(false) }}
          className="fixed bottom-4 right-4 z-40 flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition text-sm">
          <ShoppingCart className="w-4 h-4" />
          <span className="font-semibold">{cartItemCount}</span>
        </button>
      )}

      {/* Hero — side by side on sm+, stacked on mobile */}
      <div className="bg-white">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 flex flex-col sm:flex-row gap-3 sm:gap-6 sm:items-center">
          {heroImage && (
            <div className="w-full sm:w-56 md:w-72 lg:w-80 flex-shrink-0 aspect-[4/3] sm:aspect-square rounded-lg overflow-hidden">
              <img src={heroImage} alt={product.name} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{product.name}</h1>
            {product.description && <p className="text-gray-500 mt-0.5 text-xs sm:text-sm line-clamp-2">{product.description}</p>}
            <p className="text-xl sm:text-2xl font-bold text-indigo-600 mt-1">{formatPrice(product.price)}</p>
            <p className="text-[10px] text-gray-400 mt-1">
              {variantGroups.length} {variantGroups.length === 1 ? 'variant' : 'variants'} available
            </p>
          </div>
        </div>
      </div>

      {/* Variant cards — 2-col grid on sm+, expanded card spans full width */}
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {variantGroups.map((group, idx) => {
            const isExpanded = expandedIndex === idx
            const thumb = group.images[0] || product.images?.[0]
            const totalStock = group.sizes.reduce((s, sz) => s + sz.stock, 0)

            return (
              <div key={idx} className={`bg-white rounded-lg border overflow-hidden transition-shadow ${isExpanded ? 'border-indigo-200 shadow-md sm:col-span-2 lg:col-span-3' : 'border-gray-200 shadow-sm hover:shadow'}`}>
                <button
                  onClick={() => handleExpandVariant(idx)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left"
                >
                  {thumb ? (
                    <img src={thumb} alt={group.colour} className="w-12 h-12 rounded object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <ShoppingCart className="w-4 h-4 text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">{group.colour}</h3>
                      <span className="text-xs font-semibold text-indigo-600 flex-shrink-0">{formatPrice(product.price)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-px">
                      <p className="text-[11px] text-gray-400">{group.sizes.map(s => s.size).join(' · ')}</p>
                      {totalStock === 0 && <span className="text-[10px] px-1.5 py-px rounded-full bg-red-50 text-red-500">Sold out</span>}
                      {totalStock > 0 && totalStock <= 10 && <span className="text-[10px] text-orange-500">{totalStock} left</span>}
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 ${isExpanded ? 'bg-indigo-100 rotate-45' : 'bg-gray-100'}`}>
                    <Plus className={`w-3 h-3 transition-colors ${isExpanded ? 'text-indigo-600' : 'text-gray-400'}`} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100" style={{ animation: 'storeSlideDown .25s ease-out' }}>
                    <div className="p-3 flex flex-col sm:flex-row gap-3">
                      <div className="w-full sm:w-48 md:w-56 lg:w-64 flex-shrink-0">
                        {group.images.length > 0 ? (
                          <ImageViewer images={group.images} />
                        ) : product.images?.length ? (
                          <ImageViewer images={product.images} />
                        ) : (
                          <div className="aspect-square rounded bg-gray-100 flex items-center justify-center">
                            <ShoppingCart className="w-6 h-6 text-gray-300" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 flex flex-col justify-center gap-2.5 min-w-0">
                        <div>
                          <p className="text-[11px] font-medium text-gray-400 mb-1">Size</p>
                          <div className="flex flex-wrap gap-1">
                            {group.sizes.map(s => {
                              const isActive = selectedSize === s.size
                              const hasStock = s.stock > 0
                              return (
                                <button
                                  key={s.size}
                                  onClick={() => { setSelectedSize(s.size); setQuantity(1) }}
                                  disabled={!hasStock}
                                  className={`px-2.5 py-1 rounded border text-xs font-medium transition-all ${
                                    isActive
                                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                      : hasStock
                                        ? 'border-gray-200 hover:border-indigo-300 text-gray-600'
                                        : 'border-gray-100 text-gray-300 line-through cursor-not-allowed'
                                  }`}
                                >
                                  {s.size}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {selectedVariant && selectedVariant.stock > 0 && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-gray-400">Qty</span>
                            <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-0.5 border rounded hover:bg-gray-50">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-semibold w-5 text-center">{quantity}</span>
                            <button onClick={() => setQuantity(q => Math.min(selectedVariant.stock, q + 1))} className="p-0.5 border rounded hover:bg-gray-50">
                              <Plus className="w-3 h-3" />
                            </button>
                            <span className="text-[10px] text-gray-400">{selectedVariant.stock} in stock</span>
                          </div>
                        )}

                        <button
                          onClick={addToCart}
                          disabled={!selectedVariant || selectedVariant.stock === 0}
                          className="w-full sm:w-auto px-6 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          {!selectedVariant || selectedVariant.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {(showCart || showCheckout) && <CartDrawer />}
    </div>
  )
}
