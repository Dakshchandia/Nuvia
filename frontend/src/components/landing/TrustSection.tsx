import { motion } from 'framer-motion'
import { Shield, Lock, Bell } from 'lucide-react'

const items = [
  {
    icon: <Shield size={18} />,
    title: 'Not a replacement for professionals',
    desc: 'Nuvia organises what you share. Clinical decisions stay with qualified healthcare professionals.',
  },
  {
    icon: <Lock size={18} />,
    title: 'Your privacy matters',
    desc: 'Conversations are yours. Nothing is shared unless you choose to share it.',
  },
  {
    icon: <Bell size={18} />,
    title: 'Urgent concerns need care now',
    desc: "If something feels urgent, contact your doctor or emergency services — don't wait for an app.",
  },
]

export function TrustSection() {
  return (
    <section id="trust" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-12 items-start"
        >
          {/* Left */}
          <div>
            <h2 className="text-4xl lg:text-5xl mb-4"
              style={{ fontFamily: '"Playfair Display", serif', color: '#1a1008' }}
            >
              Careful by design.
            </h2>
            <p className="text-nuvia-muted text-base leading-relaxed">
              Nuvia is a communication aid. It does not diagnose, and it makes no claims about medical outcomes.
            </p>
          </div>

          {/* Right */}
          <div className="space-y-6">
            {items.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: 12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-4"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: '#fdf0f0', color: '#4a1f1f' }}
                >
                  {item.icon}
                </div>
                <div>
                  <p className="font-semibold text-sm mb-1" style={{ color: '#1a1008' }}>{item.title}</p>
                  <p className="text-sm text-nuvia-muted leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
