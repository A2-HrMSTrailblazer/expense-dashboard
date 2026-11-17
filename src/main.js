import { createApp } from 'vue'
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js'
import App from './App.vue'
import './style.css'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend)
Chart.defaults.font.family =
  "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
Chart.defaults.font.size = 12
Chart.defaults.color = '#64748b'

createApp(App).mount('#app')
