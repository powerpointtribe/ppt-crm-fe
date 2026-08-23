import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { verifyPayment, getOrderStatus } from '@/services/store'

export default function PaymentVerify() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')
  const [order, setOrder] = useState<any>(null)

  useEffect(() => {
    verify()
  }, [])

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-sm border max-w-md w-full p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-indigo-600 mx-auto animate-spin" />
            <h1 className="text-xl font-semibold text-gray-900 mt-4">Verifying Payment...</h1>
            <p className="text-gray-500 mt-2">Please wait while we confirm your payment</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h1 className="text-xl font-semibold text-gray-900 mt-4">Payment Successful!</h1>
            <p className="text-gray-500 mt-2">Your order has been placed successfully</p>

            {order && (
              <div className="bg-gray-50 rounded-lg p-4 mt-4 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Order Number</span>
                  <span className="font-mono font-semibold text-gray-900">{order.orderNumber}</span>
                </div>
                {order.totalAmount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Amount Paid</span>
                    <span className="font-semibold text-gray-900">{formatPrice(order.totalAmount)}</span>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => navigate(storePath)}
              className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Continue Shopping
            </button>
          </>
        )}

        {status === 'failed' && (
          <>
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
          </>
        )}
      </div>
    </div>
  )
}
