import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ShoppingCart, Minus, Plus, Tag, ChevronLeft, Check, X, Play, Pause } from 'lucide-react'
import {
  getProductBySlug, getActiveProducts, createOrder, initiatePayment,
  validateCoupon, type Product, type ProductVariant,
} from '@/services/store'
import { showToast } from '@/utils/toast'

function ensureAnimStyles() {
  if (typeof document !== 'undefined' && !document.head.querySelector('[data-store-anim]')) {
    const s = document.createElement('style')
    s.setAttribute('data-store-anim', '')
    s.textContent = `
      @keyframes storeFadeIn { from { opacity: 0 } to { opacity: 1 } }
      @keyframes storeSlideUp { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
    `
    document.head.appendChild(s)
  }
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount)
}

interface CartItem {
  product: Product
  variant: ProductVariant
  quantity: number
}

interface ColourOption {
  colour: string
  fullColour: string
  images: string[]
  sizes: { size: string; stock: number; variant: ProductVariant }[]
}

interface DesignGroup {
  design: string
  colours: ColourOption[]
}

const COLOUR_HEX: Record<string, string> = {
  Black: '#3a3735',
  Grey:  '#9a9590',
  Blue:  '#5a6e8a',
  Red:   '#96403c',
}

function parseDesignColour(colour: string): { design: string; color: string } {
  const m = colour.match(/^(.+?)\s*\(([^)]+)\)$/)
  return m ? { design: m[1].trim(), color: m[2].trim() } : { design: colour, color: '' }
}

function groupVariantsByDesign(variants: ProductVariant[]): DesignGroup[] {
  const colourGroups: { fullColour: string; images: string[]; sizes: { size: string; stock: number; variant: ProductVariant }[] }[] = []
  let cur: typeof colourGroups[0] | null = null
  for (const v of variants) {
    const newGroup = !cur || v.colour !== cur.fullColour || (v.images?.length && cur.sizes.length > 0)
    if (newGroup) {
      cur = { fullColour: v.colour, images: v.images?.length ? [...v.images] : [], sizes: [] }
      colourGroups.push(cur)
    }
    cur!.sizes.push({ size: v.size, stock: v.stock, variant: v })
  }

  const designMap = new Map<string, DesignGroup>()
  for (const cg of colourGroups) {
    const { design, color } = parseDesignColour(cg.fullColour)
    if (!designMap.has(design)) designMap.set(design, { design, colours: [] })
    designMap.get(design)!.colours.push({
      colour: color || cg.fullColour,
      fullColour: cg.fullColour,
      images: cg.images,
      sizes: cg.sizes,
    })
  }
  return Array.from(designMap.values())
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

  useEffect(() => { ensureAnimStyles() }, [])

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

  // Prune stale cart items whose colour/size no longer exist in the product
  useEffect(() => {
    if (!product) return
    const validKeys = new Set(product.variants.map(v => `${v.colour}|${v.size}`))
    setCart(prev => {
      const pruned = prev.filter(item => {
        if (item.product._id !== product._id) return true
        return validKeys.has(`${item.variant.colour}|${item.variant.size}`)
      })
      if (pruned.length < prev.length) {
        showToast.info(`${prev.length - pruned.length} outdated item(s) removed from cart`)
      }
      return pruned.length === prev.length ? prev : pruned
    })
  }, [product])

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

  const [selectedColour, setSelectedColour] = useState<string | null>(null)

  const designGroups = useMemo(() =>
    product ? groupVariantsByDesign(product.variants) : []
  , [product])

  const handleExpandVariant = (idx: number) => {
    if (expandedIndex === idx) { setExpandedIndex(null); return }
    setExpandedIndex(idx)
    const group = designGroups[idx]
    if (group) {
      const firstColour = group.colours[0]
      setSelectedColour(firstColour?.colour || null)
      const avail = firstColour?.sizes.find(s => s.stock > 0)
      setSelectedSize(avail?.size || firstColour?.sizes[0]?.size || null)
    }
    setQuantity(1)
  }

  const expandedGroup = expandedIndex !== null ? designGroups[expandedIndex] ?? null : null
  const activeColourOption = expandedGroup?.colours.find(c => c.colour === selectedColour) || expandedGroup?.colours[0] || null
  const selectedVariant = activeColourOption
    ? activeColourOption.sizes.find(s => s.size === selectedSize)?.variant || null
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
    setExpandedIndex(null)
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
          address: delivery.address.trim() || 'N/A',
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
                          <p className="text-xs text-gray-500">{parseDesignColour(item.variant.colour).design} · {parseDesignColour(item.variant.colour).color} · {item.variant.size}</p>
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
                    <span className="text-gray-600">{parseDesignColour(item.variant.colour).design} ({parseDesignColour(item.variant.colour).color}, {item.variant.size}) x{item.quantity}</span>
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

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-5">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{product.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-xl font-bold text-indigo-600">{formatPrice(product.price)}</p>
            <span className="text-xs text-gray-400">{designGroups.length} designs available</span>
          </div>
          {product.description && <p className="text-gray-500 mt-1 text-sm">{product.description}</p>}
        </div>
      </div>

      {/* Variant cards grid */}
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {designGroups.map((group, idx) => {
            const firstWithImages = group.colours.find(c => c.images.length > 0)
            const thumb = firstWithImages?.images[0] || product.images?.[0]
            const totalStock = group.colours.reduce((s, c) => s + c.sizes.reduce((s2, sz) => s2 + sz.stock, 0), 0)
            const availableColours = group.colours.map(c => c.colour)

            return (
              <button
                key={idx}
                onClick={() => handleExpandVariant(idx)}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden text-left shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 group/card"
              >
                {thumb ? (
                  <div className="aspect-square overflow-hidden">
                    <img src={thumb} alt={group.design} className="w-full h-full object-cover group-hover/card:scale-105 transition duration-300" />
                  </div>
                ) : (
                  <div className="aspect-square bg-gray-50 flex items-center justify-center">
                    <ShoppingCart className="w-8 h-8 text-gray-200" />
                  </div>
                )}
                <div className="p-2.5">
                  <h3 className="font-semibold text-gray-900 text-xs sm:text-sm truncate group-hover/card:text-indigo-600 transition-colors">{group.design}</h3>
                  <p className="text-xs font-bold text-indigo-600 mt-0.5">{formatPrice(product.price)}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {availableColours.map(c => (
                      <span key={c} className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: COLOUR_HEX[c] || '#ccc' }} />
                    ))}
                    {totalStock === 0 && <span className="text-[9px] px-1 py-px rounded-full bg-red-50 text-red-500 font-medium ml-auto">Sold out</span>}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Quick-view modal */}
      {expandedIndex !== null && expandedGroup && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ animation: 'storeFadeIn .15s ease' }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setExpandedIndex(null)} />
          <div
            className="relative w-full sm:w-auto sm:max-w-2xl sm:mx-4 max-h-[92vh] bg-white sm:rounded-2xl overflow-hidden shadow-2xl rounded-t-2xl"
            style={{ animation: 'storeSlideUp .25s ease-out' }}
          >
            {/* Close */}
            <button
              onClick={() => setExpandedIndex(null)}
              className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col sm:flex-row max-h-[92vh] overflow-y-auto sm:overflow-hidden">
              {/* Image side */}
              <div className="sm:w-[55%] flex-shrink-0 bg-gray-50">
                <div className="p-3 sm:p-4 sm:h-full sm:flex sm:flex-col sm:justify-center">
                  {(() => {
                    const imgs = activeColourOption?.images.length ? activeColourOption.images
                      : expandedGroup.colours.find(c => c.images.length)?.images || product.images || []
                    return imgs.length > 0 ? (
                      <ImageViewer images={imgs} />
                    ) : (
                      <div className="aspect-square rounded-xl bg-gray-100 flex items-center justify-center">
                        <ShoppingCart className="w-10 h-10 text-gray-200" />
                      </div>
                    )
                  })()}
                </div>
              </div>

              {/* Details side */}
              <div className="sm:w-[45%] p-5 sm:p-6 flex flex-col justify-center gap-4 sm:overflow-y-auto sm:max-h-[92vh]">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">{expandedGroup.design}</h2>
                  <p className="text-xl font-bold text-indigo-600 mt-1">{formatPrice(product.price)}</p>
                </div>

                {/* Colour selector */}
                {expandedGroup.colours.length > 1 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Colour <span className="font-normal text-gray-400">— {selectedColour}</span></p>
                    <div className="flex flex-wrap gap-2">
                      {expandedGroup.colours.map(c => {
                        const isActive = selectedColour === c.colour
                        const colourStock = c.sizes.reduce((s, sz) => s + sz.stock, 0)
                        return (
                          <button
                            key={c.colour}
                            onClick={() => {
                              setSelectedColour(c.colour)
                              const avail = c.sizes.find(s => s.stock > 0)
                              setSelectedSize(avail?.size || c.sizes[0]?.size || null)
                              setQuantity(1)
                            }}
                            disabled={colourStock === 0}
                            title={c.colour}
                            className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center ${
                              isActive
                                ? 'border-indigo-600 ring-2 ring-indigo-200 scale-110'
                                : colourStock > 0
                                  ? 'border-gray-200 hover:border-gray-400 hover:scale-105'
                                  : 'border-gray-100 opacity-30 cursor-not-allowed'
                            }`}
                          >
                            <span className="w-7 h-7 rounded-full" style={{ backgroundColor: COLOUR_HEX[c.colour] || '#ccc' }} />
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Size selector */}
                {activeColourOption && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Size</p>
                    <div className="flex flex-wrap gap-2">
                      {activeColourOption.sizes.map(s => {
                        const isActive = selectedSize === s.size
                        const hasStock = s.stock > 0
                        return (
                          <button
                            key={s.size}
                            onClick={() => { setSelectedSize(s.size); setQuantity(1) }}
                            disabled={!hasStock}
                            className={`w-12 h-12 rounded-xl border-2 text-sm font-semibold transition-all ${
                              isActive
                                ? 'border-indigo-600 bg-indigo-600 text-white shadow-md'
                                : hasStock
                                  ? 'border-gray-200 text-gray-700 hover:border-indigo-400 hover:bg-indigo-50'
                                  : 'border-gray-100 text-gray-300 line-through cursor-not-allowed'
                            }`}
                          >
                            {s.size}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                {selectedVariant && selectedVariant.stock > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Quantity</p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                        <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-3 py-2 hover:bg-gray-50 transition">
                          <Minus className="w-4 h-4 text-gray-500" />
                        </button>
                        <span className="text-sm font-bold w-10 text-center">{quantity}</span>
                        <button onClick={() => setQuantity(q => Math.min(selectedVariant.stock, q + 1))} className="px-3 py-2 hover:bg-gray-50 transition">
                          <Plus className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                      <span className="text-xs text-gray-400">{selectedVariant.stock} in stock</span>
                    </div>
                  </div>
                )}

                {/* Add to Cart */}
                <button
                  onClick={addToCart}
                  disabled={!selectedVariant || selectedVariant.stock === 0}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {!selectedVariant || selectedVariant.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(showCart || showCheckout) && <CartDrawer />}
    </div>
  )
}
