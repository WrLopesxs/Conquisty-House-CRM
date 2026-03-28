import { isSim, temContato, temVisita, temProposta, temInteresse } from "./api.js";

const LIMITS = {
  noContact: 2,
  proposalPending: 7,
  interestNoVisit: 3,
  interestNoProposal: 4
};

const toDate = (s) => {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
};

export function diasParados(dataReferencia) {
  const ref = toDate(dataReferencia);
  if (!ref) return null;
  const hoje = new Date();
  return Math.floor((hoje - ref) / (1000 * 60 * 60 * 24));
}

const refDatePropostaParada = (lead) => lead.dataVisita || lead.dataLead;
const refDateInteresseSemVisita = (lead) => lead.dataLead;
const refDateInteresseSemProposta = (lead) => lead.dataVisita || lead.dataLead;

export function buildAlerts(dados) {
  const alerts = [];

  dados.forEach((lead) => {
    if (!temContato(lead)) {
      const days = diasParados(lead.dataLead);
      if (days !== null && days >= LIMITS.noContact) {
        alerts.push({
          priority: 1,
          color: "#C0392B",
          icon: "🔴",
          title: `${lead.cliente} · ${lead.imovel}`,
          description: `Lead parado ha ${days} dias sem contato.`
        });
      }
    }

    if (temProposta(lead) && !isSim(lead.teveVenda)) {
      const days = diasParados(refDatePropostaParada(lead));
      if (days !== null && days >= LIMITS.proposalPending) {
        alerts.push({
          priority: 2,
          color: "#E67E22",
          icon: "🟠",
          title: `${lead.cliente} · ${lead.imovel}`,
          description: `Proposta sem retorno ha ${days} dias.`
        });
      }
    }

    if (temInteresse(lead) && !temVisita(lead)) {
      const days = diasParados(refDateInteresseSemVisita(lead));
      if (days !== null && days >= LIMITS.interestNoVisit) {
        alerts.push({
          priority: 2,
          color: "#D4AC0D",
          icon: "🟡",
          title: `${lead.cliente} · ${lead.imovel}`,
          description: `Interesse sem visita ha ${days} dias.`
        });
      }
    }

    if (temInteresse(lead) && !temProposta(lead)) {
      const days = diasParados(refDateInteresseSemProposta(lead));
      if (days !== null && days >= LIMITS.interestNoProposal) {
        alerts.push({
          priority: 3,
          color: "#2980B9",
          icon: "🔵",
          title: `${lead.cliente} · ${lead.imovel}`,
          description: `Interesse sem proposta ha ${days} dias.`
        });
      }
    }
  });

  return alerts.sort((a, b) => a.priority - b.priority);
}

export function renderAlerts(container, alerts) {
  if (!container) return;
  if (!alerts.length) {
    container.innerHTML = '<div class="empty">Sem alertas ativos no momento.</div>';
    return;
  }

  container.innerHTML = alerts.map((a) => `
    <article class="alert-card" style="border-left:4px solid ${a.color}">
      <strong>${a.icon} ${a.title}</strong>
      <p>${a.description}</p>
      <button class="btn" type="button">Ver lead</button>
    </article>
  `).join("");
}
