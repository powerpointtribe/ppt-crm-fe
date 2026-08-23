import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { verifyPayment, getOrderStatus } from '@/services/store'

function parseDesignColour(colour: string) {
  const m = colour?.match(/^(.+?)\s*\(([^)]+)\)$/)
  return m ? { design: m[1].trim(), color: m[2].trim() } : { design: colour || '', color: '' }
}

export default function PaymentVerify() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')
  const [order, setOrder] = useState<any>(null)

  useEffect(() => {
    verify()
  }, [])

  useEffect(() => {
    if (status === 'success') document.title = 'Order Confirmed'
    else if (status === 'failed') document.title = 'Payment Failed'
    else document.title = 'Verifying Payment...'
  }, [status])

  const productSlug = searchParams.get('product')
  const storePath = productSlug ? `/store/${productSlug}` : '/store'

  const verify = async () => {
    const transactionId = searchParams.get('transaction_id')
    const orderNumber = searchParams.get('order')

    try {
      if (transactionId) {
        const result = await verifyPayment(transactionId)
        if (result.verified) {
          setStatus('success')
          setOrder(result.order)
          localStorage.removeItem('store_cart')
          return
        }
      }

      if (orderNumber) {
        const orderData = await getOrderStatus(orderNumber)
        if (orderData.paymentStatus === 'successful') {
          setStatus('success')
          setOrder(orderData)
          localStorage.removeItem('store_cart')
          return
        }
      }

      setStatus('failed')
    } catch {
      setStatus('failed')
    }
  }

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-xl shadow-sm border max-w-md w-full p-6 sm:p-8">
        {status === 'loading' && (
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-indigo-600 mx-auto animate-spin" />
            <h1 className="text-xl font-semibold text-gray-900 mt-4">Verifying Payment...</h1>
            <p className="text-gray-500 mt-2">Please wait while we confirm your payment</p>
          </div>
        )}

        {status === 'success' && (
          <>
            <div className="text-center">
              <CheckCircle className="w-14 h-14 text-green-500 mx-auto" />
              <h1 className="text-xl font-semibold text-gray-900 mt-3">Payment Successful!</h1>
              <p className="text-gray-500 mt-1 text-sm">Your order has been placed and a confirmation email is on its way.</p>
            </div>

            {order && (
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Order</p>
                    <p className="font-mono font-semibold text-gray-900 mt-0.5">{order.orderNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Date</p>
                    <p className="text-gray-900 font-medium mt-0.5 text-sm">
                      {new Date(order.createdAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {order.items?.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Items</p>
                    <div className="space-y-2">
                      {order.items.map((item: any, idx: number) => {
                        const { design, color } = parseDesignColour(item.colour)
                        const img = item.images?.[0]
                        return (
                          <div key={idx} className="flex gap-3 items-start">
                            {img ? (
                              <img src={img} alt={item.productName} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                              <p className="text-xs text-gray-500">
                                {design}{color ? ` · ${color}` : ''}{item.size ? ` · ${item.size}` : ''} · Qty {item.quantity}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-semibold text-gray-900">{formatPrice(item.totalPrice)}</p>
                              {item.quantity > 1 && (
                                <p className="text-[11px] text-gray-400">{formatPrice(item.unitPrice)} each</p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="border-t pt-3 space-y-1.5">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Subtotal</span>
                    <span className="text-gray-700">{formatPrice(order.subtotal)}</span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-{formatPrice(order.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-gray-900 pt-1.5 border-t">
                    <span>Total Paid</span>
                    <span>{formatPrice(order.totalAmount)}</span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => navigate(storePath)}
              className="mt-6 w-full py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition text-sm"
            >
              Continue Shopping
            </button>
          </>
        )}

        {status === 'failed' && (
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h1 className="text-xl font-semibold text-gray-900 mt-4">Payment Verification Failed</h1>
            <p className="text-gray-500 mt-2">
              We couldn't verify your payment. If you were charged, please contact support with your order details.
            </p>
            <button
              onClick={() => navigate(storePath)}
              className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Back to Store
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
