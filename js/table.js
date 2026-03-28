import { calcularStatus } from "./api.js";

const STATUS_COLORS = {
  Venda: { bg: "#D4EDDA", text: "#1A7A3C" },
  Perdido: { bg: "#FADBD8", text: "#922B21" },
  Proposta: { bg: "#FDE8CE", text: "#A04000" },
  Visita: { bg: "#E8DAEF", text: "#6C3483" },
  Contato: { bg: "#D6EAF8", text: "#1A5276" },
  Lead: { bg: "#F0E4C2", text: "#7D6608" }
};

const formatDate = (iso) => iso ? new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR") : "-";
const formatCurrency = (n) => n > 0 ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }) : "-";

export function createTableController(dados, refs) {
  let sourceData = Array.isArray(dados) ? dados : [];
  let page = 1;
  let perPage = 20;
  let sortBy = "dataLead";
  let sortDir = "desc";

  const getFilters = () => ({
    q: refs.search.value.trim().toLowerCase(),
    status: refs.status.value,
    origem: refs.origem.value,
    corretor: refs.corretor ? refs.corretor.value : "",
    min: Number(refs.minValor.value || 0),
    max: Number(refs.maxValor.value || 0)
  });

  const applyFilters = () => {
    const f = getFilters();
    return sourceData
      .filter((l) => {
        const txt = `${l.cliente} ${l.imovel}`.toLowerCase();
        if (f.q && !txt.includes(f.q)) return false;
        const status = calcularStatus(l);
        if (f.status && status !== f.status) return false;
        if (f.origem && l.origemLead !== f.origem) return false;
        if (f.corretor && l.corretor !== f.corretor) return false;
        if (f.min && l.valorImovel < f.min) return false;
        if (f.max && l.valorImovel > f.max) return false;
        return true;
      })
      .sort((a, b) => {
        const va = a[sortBy] ?? "";
        const vb = b[sortBy] ?? "";
        if (va < vb) return sortDir === "asc" ? -1 : 1;
        if (va > vb) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
  };

  const render = () => {
    const filtered = applyFilters();
    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    if (page > totalPages) page = totalPages;

    const start = (page - 1) * perPage;
    const rows = filtered.slice(start, start + perPage);

    refs.tbody.innerHTML = rows.map((l) => {
      const status = calcularStatus(l);
      const c = STATUS_COLORS[status] || STATUS_COLORS.Lead;
      return `
        <tr>
          <td>${l.cliente}</td>
          <td>${l.imovel}</td>
          <td>${formatDate(l.dataLead)}</td>
          <td><span class="badge">${l.origemLead}</span></td>
          <td><span class="badge-status" style="background:${c.bg};color:${c.text}">● ${status}</span></td>
          <td class="mono">${formatCurrency(l.valorImovel)}</td>
          <td>${l.statusContato || "-"}</td>
          <td title="${l.observacoes || "Sem observacoes"}">${l.observacoes ? "Ver" : "-"}</td>
        </tr>
      `;
    }).join("");

    refs.pageInfo.textContent = `${page}/${totalPages} · ${filtered.length} registros`;
    refs.prev.disabled = page <= 1;
    refs.next.disabled = page >= totalPages;
  };

  const unique = (arr) => [...new Set(arr)].sort();
  const refillSelect = (selectEl, values, placeholder) => {
    if (!selectEl) return;
    const current = selectEl.value;
    selectEl.innerHTML = `<option value="">${placeholder}</option>`;
    values.forEach((value) => selectEl.insertAdjacentHTML("beforeend", `<option value="${value}">${value}</option>`));
    if (values.includes(current)) selectEl.value = current;
  };

  const refreshOptions = () => {
    refillSelect(refs.status, unique(sourceData.map((d) => calcularStatus(d))), "Status");
    refillSelect(refs.origem, unique(sourceData.map((d) => d.origemLead)), "Origem");
    if (refs.corretor) {
      refillSelect(refs.corretor, unique(sourceData.map((d) => d.corretor).filter(Boolean)), "Corretor");
    }
  };

  refreshOptions();

  [refs.search, refs.status, refs.origem, refs.corretor, refs.minValor, refs.maxValor].filter(Boolean).forEach((el) => {
    el.addEventListener("input", () => { page = 1; render(); });
    el.addEventListener("change", () => { page = 1; render(); });
  });

  refs.prev.addEventListener("click", () => { page -= 1; render(); });
  refs.next.addEventListener("click", () => { page += 1; render(); });
  refs.perPage.addEventListener("change", () => { perPage = Number(refs.perPage.value); page = 1; render(); });

  refs.headings.forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.dataset.sort;
      if (!key) return;
      if (sortBy === key) sortDir = sortDir === "asc" ? "desc" : "asc";
      else { sortBy = key; sortDir = "asc"; }
      render();
    });
  });

  render();

  return {
    setData(nextData) {
      sourceData = Array.isArray(nextData) ? nextData : [];
      page = 1;
      refreshOptions();
      render();
    }
  };
}
