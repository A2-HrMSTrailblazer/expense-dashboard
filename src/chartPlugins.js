// Small Chart.js plugin that prints a label at the end of each bar
// (or on top of each stack) so values are readable without hovering.
export const valueLabels = {
  id: 'valueLabels',
  afterDatasetsDraw(chart, _args, opts) {
    if (!opts || !opts.format) return
    const { ctx } = chart
    const horizontal = chart.options.indexAxis === 'y'
    ctx.save()
    ctx.font = `${opts.weight || 600} 11px ${chart.options.font?.family || 'system-ui'}`
    ctx.fillStyle = opts.color || '#0f172a'

    if (opts.stackTotal) {
      // one label per index: the sum of all visible datasets
      const metaLast = chart.getDatasetMeta(chart.data.datasets.length - 1)
      metaLast.data.forEach((bar, i) => {
        const total = chart.data.datasets.reduce((s, d) => s + (d.data[i] || 0), 0)
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'
        ctx.fillText(opts.format(total, i), bar.x, bar.y - 4)
      })
    } else {
      chart.data.datasets.forEach((ds, di) => {
        if (opts.datasets && !opts.datasets.includes(di)) return
        const meta = chart.getDatasetMeta(di)
        if (meta.hidden) return
        meta.data.forEach((bar, i) => {
          const text = opts.format(ds.data[i], i, di)
          if (!text) return
          if (horizontal) {
            ctx.textAlign = 'left'
            ctx.textBaseline = 'middle'
            ctx.fillText(text, bar.x + 6, bar.y)
          } else {
            ctx.textAlign = 'center'
            ctx.textBaseline = 'bottom'
            ctx.fillText(text, bar.x, bar.y - 4)
          }
        })
      })
    }
    ctx.restore()
  },
}
