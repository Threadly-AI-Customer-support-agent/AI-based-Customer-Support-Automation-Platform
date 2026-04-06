import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronUp, ArrowLeft, RotateCcw, Truck, Package, Scissors, Headphones, Ban } from 'lucide-react'

const faqSections = [
  {
    title: 'Returns & Exchanges',
    icon: RotateCcw,
    color: 'from-blue-500 to-blue-600',
    items: [
      { q: 'What is the return window?', a: 'We accept returns and exchanges within 30 days of the delivery date.' },
      { q: 'What condition must items be in?', a: 'To be eligible for a return, the clothing or fabric must be unwashed, unworn, and have all original tags attached.' },
      { q: 'Is there a return shipping fee?', a: 'A standard return shipping fee of $5.99 is deducted from your refund. Exchanges are completely free of charge.' },
      { q: 'How long does a refund take?', a: 'Once we receive the returned item at our warehouse, refunds are processed to the original payment method within 5–7 business days.' },
    ],
  },
  {
    title: 'Damaged or Defective Items',
    icon: Ban,
    color: 'from-red-500 to-rose-600',
    items: [
      { q: 'What if I receive a damaged item?', a: 'We take quality control seriously. If you receive a torn, stained, or defective item, you are entitled to a free replacement or a full refund.' },
      { q: 'How do I report a defect?', a: 'You must upload a clear photo of the defect in the chat. Our automated system will verify the damage.' },
      { q: 'Do I need to ship defective items back?', a: 'No. If verified, we will instantly issue a replacement or refund. You do not need to ship the defective item back — you may discard or donate it.' },
    ],
  },
  {
    title: 'Shipping & Delivery',
    icon: Truck,
    color: 'from-emerald-500 to-emerald-600',
    items: [
      { q: 'How much does standard shipping cost?', a: 'Standard Shipping takes 5–7 business days and costs $4.99.' },
      { q: 'Is free shipping available?', a: 'Yes! All orders over $75 automatically qualify for free Standard Shipping.' },
      { q: 'How fast is expedited shipping?', a: 'Expedited Shipping takes 2–3 business days and costs $12.99.' },
      { q: 'How do I track my order?', a: 'Once your order ships, you will receive a tracking link. You can also type "Where is my order?" in the chat to check the status.' },
    ],
  },
  {
    title: 'Orders & Cancellations',
    icon: Package,
    color: 'from-amber-500 to-orange-600',
    items: [
      { q: 'Can I cancel or modify my order?', a: 'You have a 2-hour window after placing an order to cancel it or change the shipping address. After 2 hours, the order is locked and cannot be modified.' },
      { q: 'What payment methods are accepted?', a: 'We accept Visa, MasterCard, American Express, PayPal, and Apple Pay.' },
    ],
  },
  {
    title: 'Fabric Care & Sizing',
    icon: Scissors,
    color: 'from-violet-500 to-purple-600',
    items: [
      { q: 'Will my clothes shrink?', a: 'Most of our cotton garments are pre-shrunk, but we recommend washing in cold water and tumble drying on low to prevent any minor shrinkage.' },
      { q: 'How does your sizing run?', a: 'Our clothing runs true to size. If you are between sizes, we recommend sizing up for a relaxed fit.' },
    ],
  },
  {
    title: 'Customer Support',
    icon: Headphones,
    color: 'from-cyan-500 to-teal-600',
    items: [
      { q: 'Can I speak to a human agent?', a: 'Yes! If the AI assistant cannot resolve your issue, you can ask to speak to a human agent at any time.' },
      { q: 'What are the support hours?', a: 'Our live human support agents are available Monday through Friday, 9:00 AM to 6:00 PM EST. Tickets submitted outside these hours will be answered the next business day.' },
    ],
  },
]

function FAQItem({ item }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className={`border border-white/[0.06] rounded-xl transition-all duration-200 ${open ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'}`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
      >
        <span className="text-sm font-medium text-white/90">{item.q}</span>
        {open
          ? <ChevronUp className="w-4 h-4 text-white/40 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-white/40 shrink-0" />
        }
      </button>
      {open && (
        <div className="px-5 pb-4 pt-0">
          <p className="text-sm text-white/60 leading-relaxed">{item.a}</p>
        </div>
      )}
    </div>
  )
}

export default function FAQs() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen w-full bg-[#0c1017]/95">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/[0.08] bg-[#0d1118]/95 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto flex items-center gap-4 px-6 py-4">
          <button
            onClick={() => navigate('/chat')}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-white">Frequently Asked Questions</h1>
            <p className="text-xs text-white/40">Everything you need to know about our policies</p>
          </div>
        </div>
      </header>

      {/* FAQ Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {faqSections.map((section) => {
          const Icon = section.icon
          return (
            <section key={section.title}>
              {/* Section Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-4.5 h-4.5 text-white" />
                </div>
                <h2 className="text-base font-semibold text-white">{section.title}</h2>
              </div>

              {/* Questions */}
              <div className="space-y-2 pl-0 sm:pl-12">
                {section.items.map((item, i) => (
                  <FAQItem key={i} item={item} />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
