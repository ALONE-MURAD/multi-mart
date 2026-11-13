import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Clock } from 'lucide-react';
import { subscribeOrderById } from '../../services/firestoreService';
import { useI18n } from '../../shared/contexts/I18nContext';
import { formatBDT } from '../../shared/utils';
import type { Order, OrderStatus } from '../../shared/types';

const STEPS: OrderStatus[] = ['pending', 'confirmed', 'packed', 'shipped', 'delivered'];

export default function OrderTrackingPage() {
  const { orderId = '' } = useParams();
  const { lang } = useI18n();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return subscribeOrderById(orderId, (item) => {
      setOrder(item);
      setLoading(false);
    });
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <p className="text-sm text-slate-600">Order not found.</p>
        <Link to="/orders" className="mt-4 inline-block text-sm font-semibold text-emerald-700">
          Back to Orders
        </Link>
      </div>
    );
  }

  const activeStep = STEPS.indexOf(order.orderStatus);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-mono">{order.orderNumber}</h1>
          <p className="text-xs text-slate-500">
            Vendor: {order.sellerName} · Payment: {order.paymentMethod.toUpperCase()} (
            {order.paymentStatus})
          </p>
        </div>
        <Link to="/orders" className="text-xs font-semibold text-emerald-700 hover:underline">
          All Orders
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        {order.orderStatus === 'cancelled' ? (
          <p className="text-sm font-semibold text-rose-600">This order has been cancelled.</p>
        ) : (
          <div className="grid grid-cols-5 gap-2">
            {STEPS.map((step, idx) => {
              const done = idx <= activeStep;
              return (
                <div key={step} className="flex flex-col items-center text-center">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                      done
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-400'
                    }`}
                  >
                    {done ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                  </div>
                  <span
                    className={`mt-2 text-xs font-semibold capitalize ${
                      done ? 'text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        {order.trackingCode && (
          <p className="mt-5 text-xs text-slate-600 font-mono">
            Courier Tracking Code: <span className="font-bold">{order.trackingCode}</span>
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900">Items & Receipt</h2>
        <div className="divide-y divide-slate-100 text-sm">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between py-2.5">
              <span>
                {item.titleEn} × {item.quantity}
              </span>
              <span className="font-semibold font-mono tabular-nums">
                {formatBDT(item.price * item.quantity, lang)}
              </span>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-100 pt-3 flex justify-between text-base font-bold">
          <span>Total</span>
          <span className="font-mono tabular-nums">{formatBDT(order.totalAmount, lang)}</span>
        </div>
        <div className="border-t border-slate-100 pt-3 text-xs text-slate-600">
          Deliver to: {order.shippingAddress.fullName}, {order.shippingAddress.streetAddress},{' '}
          {order.shippingAddress.area}, {order.shippingAddress.district},{' '}
          {order.shippingAddress.division} ({order.shippingAddress.phone})
        </div>
      </div>
    </div>
  );
}
