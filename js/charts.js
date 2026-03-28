import { calcularStatus, temContato, temVisita, temProposta } from "./api.js";

let chartRegistry = [];

const destroyCharts = () => {
  chartRegistry.forEach((c) => c.destroy());
  chartRegistry = [];
};

const groupCount = (arr, keyFn) => arr.reduce((acc, item) => {
  const key = keyFn(item) || "Nao informado";
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {});

export function buildFunnelData(dados) {
  const c = (fn) => dados.filter(fn).length;
  const total = dados.length;
  const contato = c((l) => temContato(l));
  const visita = c((l) => temVisita(l));
  const proposta = c((l) => temProposta(l));
  const venda = c((l) => calcularStatus(l) === "Venda");
  const perdido = c((l) => calcularStatus(l) === "Perdido");
  return { total, contato, visita, proposta, venda, perdido };
}

export function renderCharts(dados) {
  destroyCharts();

  const funnel = buildFunnelData(dados);
  const funnelCtx = document.getElementById("funnelChart");
  const originCtx = document.getElementById("origemChart");
  const monthCtx = document.getElementById("mesChart");
  const statusCtx = document.getElementById("statusChart");

  if (funnelCtx) {
    chartRegistry.push(new Chart(funnelCtx, {
      type: "bar",
      data: {
        labels: ["Lead", "Contato", "Visita", "Proposta", "Venda", "Perdido"],
        datasets: [{
          data: [funnel.total, funnel.contato, funnel.visita, funnel.proposta, funnel.venda, funnel.perdido],
          backgroundColor: ["#C9A84C", "#4A90D9", "#7B68EE", "#E67E22", "#27AE60", "#C0392B"],
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true } }
      }
    }));
  }

  if (originCtx) {
    const grouped = groupCount(dados, (l) => l.origemLead);
    chartRegistry.push(new Chart(originCtx, {
      type: "doughnut",
      data: {
        labels: Object.keys(grouped),
        datasets: [{ data: Object.values(grouped), backgroundColor: ["#C9A84C", "#4A90D9", "#7B68EE", "#E67E22", "#27AE60", "#D35400"] }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "58%",
        plugins: { legend: { position: "bottom" } }
      }
    }));
  }

  if (monthCtx) {
    const grouped = groupCount(dados, (l) => (l.dataLead ? l.dataLead.slice(0, 7) : "Sem data"));
    const labels = Object.keys(grouped).sort();
    chartRegistry.push(new Chart(monthCtx, {
      type: "bar",
      data: {
        labels,
        datasets: [{ label: "Leads", data: labels.map((l) => grouped[l]), backgroundColor: "#C9A84C" }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }
    }));
  }

  if (statusCtx) {
    const grouped = groupCount(dados, (l) => l.statusContato);
    chartRegistry.push(new Chart(statusCtx, {
      type: "pie",
      data: {
        labels: Object.keys(grouped),
        datasets: [{ data: Object.values(grouped), backgroundColor: ["#4A90D9", "#7B68EE", "#E67E22", "#27AE60", "#C9A84C"] }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom" } }
      }
    }));
  }

  return funnel;
}

