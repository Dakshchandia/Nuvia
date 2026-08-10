import { motion } from 'framer-motion'

export function ProblemSolution() {
  return (
    <section id="problem" className="py-24" style={{ background: '#f7f3ee' }}>
      <div className="max-w-6xl mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl lg:text-5xl mb-16 max-w-2xl"
          style={{ fontFamily: '"Playfair Display", serif', color: '#1a1008' }}
        >
          When health concerns don't fit into a form.
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Traditional */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl border border-nuvia-border p-8"
          >
            <p className="text-[11px] font-bold uppercase tracking-widest text-nuvia-subtle mb-6">
              Traditional workflow
            </p>
            <div className="space-y-3 mb-6">
              {['Headache', 'Dizziness', 'Fatigue', 'Other'].map(item => (
                <div key={item} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-nuvia-border">
                  <div className="w-4 h-4 rounded border border-nuvia-border flex-shrink-0" />
                  <span className="text-sm text-nuvia-muted">{item}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-nuvia-subtle italic">
              Isolated checkboxes. No timeline, no nuance, no "it started after yesterday."
            </p>
          </motion.div>

          {/* With Nuvia */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl border border-nuvia-border p-8"
            style={{ background: 'linear-gradient(135deg, #fdf0f0 0%, #f7f3ee 50%, #f0f5f0 100%)' }}
          >
            <p className="text-[11px] font-bold uppercase tracking-widest text-nuvia-subtle mb-6">
              With Nuvia
            </p>
            <div className="space-y-3 mb-6">
              {[
                '"The dizziness comes back every afternoon, and it\'s worse than last week."',
                '"Swelling stayed overnight this time."',
                '"I\'m also sleeping badly since the weekend."',
              ].map((msg, i) => (
                <div key={i} className="bubble-nuvia text-sm">
                  {msg}
                </div>
              ))}
            </div>
            <p className="text-sm font-medium" style={{ color: '#5a8a6a' }}>
              One evolving thread: symptoms, timing and change—kept together.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
