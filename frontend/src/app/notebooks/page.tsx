"use client";

import { useEffect, useState } from "react";

import { ProtectedPage } from "@/components/protected-page";
import { SectionCard } from "@/components/section-card";
import { StatusPill } from "@/components/status-pill";
import { ApiError, deleteJson, downloadFile, getJson, postJson, putJson } from "@/lib/api";
import { notebookStatusTone, translateNotebookStatus } from "@/lib/pt-br";
import type { Notebook } from "@/lib/types";

type NotebookForm = Omit<Notebook, "id">;

const notebookDefaults: NotebookForm = {
  brand: "",
  model: "",
  serialNumber: "",
  processor: "",
  gpu: "",
  screenSize: "",
  ramTotal: 8,
  ramSticks: 1,
  storageType: "SSD",
  storageCapacity: "",
  condition: "Novo",
  location: "",
  status: "Em Estoque",
  entryDate: new Date().toISOString().slice(0, 10),
};

export default function NotebooksPage() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [selectedId, setSelectedId] = useState<number>(0);
  const [filters, setFilters] = useState({ search: "", status: "Todos" });
  const [form, setForm] = useState<NotebookForm>(notebookDefaults);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadNotebooks() {
    const payload = await getJson<Notebook[]>("/notebooks");
    setNotebooks(payload);
  }

  useEffect(() => {
    void loadNotebooks().catch(() => setError("Não foi possível carregar os portáteis."));
  }, []);

  useEffect(() => {
    const current = notebooks.find((item) => item.id === selectedId);
    if (!current) {
      setForm(notebookDefaults);
      return;
    }
    setForm({
      brand: current.brand,
      model: current.model,
      serialNumber: current.serialNumber ?? "",
      processor: current.processor ?? "",
      gpu: current.gpu ?? "",
      screenSize: current.screenSize ?? "",
      ramTotal: Number(current.ramTotal),
      ramSticks: Number(current.ramSticks),
      storageType: current.storageType ?? "SSD",
      storageCapacity: current.storageCapacity ?? "",
      condition: current.condition ?? "Novo",
      location: current.location ?? "",
      status: current.status ?? "Em Estoque",
      entryDate: current.entryDate.slice(0, 10),
    });
  }, [notebooks, selectedId]);

  const filteredNotebooks = notebooks.filter((item) => {
    const matchesSearch = [item.brand, item.model, item.serialNumber, item.processor]
      .join(" ")
      .toLowerCase()
      .includes(filters.search.toLowerCase());
    const matchesStatus = filters.status === "Todos" || item.status === filters.status;
    return matchesSearch && matchesStatus;
  });

  async function saveNotebook(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      if (selectedId) {
        await putJson(`/notebooks/${selectedId}`, form);
        setMessage("Portátil atualizado com sucesso.");
      } else {
        await postJson("/notebooks", form);
        setMessage("Portátil criado com sucesso.");
      }
      await loadNotebooks();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Não foi possível salvar o notebook.");
    }
  }

  async function removeNotebook() {
    if (!selectedId) {
      setError("Selecione um notebook primeiro.");
      return;
    }

    try {
      await deleteJson(`/notebooks/${selectedId}`);
      setSelectedId(0);
      setMessage("Portátil excluído com sucesso.");
      await loadNotebooks();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Não foi possível excluir o notebook.");
    }
  }

  return (
    <ProtectedPage
      title="Notebooks"
      description="Gerencie os notebooks da empresa, filtre, crie, edite e visualize o histórico de alocações."
      actions={
        <button className="secondary-button" type="button" onClick={() => void downloadFile(" / exports / notebooks", "notebooks.xlsx")}>
          Exportar Excel
        </button >
      }
    >
      {error ? <div className="message error">{error}</div> : null}
      {message ? <div className="message success">{message}</div> : null}

      <SectionCard title="Inventário de portáteis" copy="Filtre o catálogo atual por status ou termos de hardware.">
        <div className="toolbar notebook-toolbar">
          <div className="toolbar-group">
            <div className="input-group">
              <label htmlFor="notebook-search">Pesquisar</label>
              <input
                id="notebook-search"
                placeholder="Marca, modelo, serial ou processador"
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              />
            </div>
            <div className="input-group">
              <label htmlFor="notebook-status">Status</label>
              <select
                id="notebook-status"
                value={filters.status}
                onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
              >
                <option value="Todos">Todos</option>
                <option value="Em Estoque">Em estoque</option>
                <option value="Em Uso">Em uso</option>
                <option value="Manutencao">Manutenção</option>
              </select>
            </div>
          </div>
        </div>

        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Processador</th>
                <th>RAM</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotebooks.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.brand}</td>
                  <td>{item.model}</td>
                  <td>{item.processor}</td>
                  <td>{item.ramTotal} GB</td>
                  <td>
                    <StatusPill tone={notebookStatusTone(item.status)} value={translateNotebookStatus(item.status)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Criar ou editar notebook" copy="Escolha um notebook existente ou abra um novo formulário.">
        <div className="input-group">
          <label htmlFor="notebook-picker">Registro atual</label>
          <select id="notebook-picker" value={selectedId} onChange={(event) => setSelectedId(Number(event.target.value))}>
            <option value={0}>Novo portátil</option>
            {notebooks.map((item) => (
              <option key={item.id} value={item.id}>
                #{item.id} - {item.brand} {item.model}
              </option>
            ))}
          </select>
        </div>

        <form className="stack" onSubmit={saveNotebook}>
          <div className="input-grid notebook-form-grid">
            <div className="input-group">
              <label htmlFor="notebook-brand">Marca</label>
              <input id="notebook-brand" value={form.brand} onChange={(event) => setForm((current) => ({ ...current, brand: event.target.value }))} />
            </div>
            <div className="input-group">
              <label htmlFor="notebook-model">Modelo</label>
              <input id="notebook-model" value={form.model} onChange={(event) => setForm((current) => ({ ...current, model: event.target.value }))} />
            </div>
            <div className="input-group">
              <label htmlFor="notebook-serial">Número de série</label>
              <input id="notebook-serial" value={form.serialNumber} onChange={(event) => setForm((current) => ({ ...current, serialNumber: event.target.value }))} />
            </div>
            <div className="input-group">
              <label htmlFor="notebook-processor">Processador</label>
              <input id="notebook-processor" value={form.processor} onChange={(event) => setForm((current) => ({ ...current, processor: event.target.value }))} />
            </div>
            <div className="input-group">
              <label htmlFor="notebook-gpu">GPU</label>
              <input id="notebook-gpu" value={form.gpu} onChange={(event) => setForm((current) => ({ ...current, gpu: event.target.value }))} />
            </div>
            <div className="input-group">
              <label htmlFor="notebook-screen">Tela</label>
              <input id="notebook-screen" value={form.screenSize} onChange={(event) => setForm((current) => ({ ...current, screenSize: event.target.value }))} />
            </div>
            <div className="input-group">
              <label htmlFor="notebook-ram">RAM total</label>
              <input id="notebook-ram" type="number" min={1} value={form.ramTotal} onChange={(event) => setForm((current) => ({ ...current, ramTotal: Number(event.target.value) }))} />
            </div>
            <div className="input-group">
              <label htmlFor="notebook-ram-sticks">Pentes de RAM</label>
              <input id="notebook-ram-sticks" type="number" min={1} value={form.ramSticks} onChange={(event) => setForm((current) => ({ ...current, ramSticks: Number(event.target.value) }))} />
            </div>
            <div className="input-group">
              <label htmlFor="notebook-storage-type">Tipo de armazenamento</label>
              <select id="notebook-storage-type" value={form.storageType} onChange={(event) => setForm((current) => ({ ...current, storageType: event.target.value }))}>
                <option value="SSD">SSD</option>
                <option value="HD">HD</option>
                <option value="NVMe">NVMe</option>
                <option value="SSD + HD">SSD + HD</option>
              </select>
            </div>
            <div className="input-group">
              <label htmlFor="notebook-storage-capacity">Capacidade de armazenamento</label>
              <input id="notebook-storage-capacity" value={form.storageCapacity} onChange={(event) => setForm((current) => ({ ...current, storageCapacity: event.target.value }))} />
            </div>
            <div className="input-group">
              <label htmlFor="notebook-condition">Condição</label>
              <select id="notebook-condition" value={form.condition} onChange={(event) => setForm((current) => ({ ...current, condition: event.target.value }))}>
                <option value="Novo">Novo</option>
                <option value="Bom">Bom</option>
                <option value="Razoavel">Razoável</option>
                <option value="Com Defeito">Com defeito</option>
              </select>
            </div>
            <div className="input-group">
              <label htmlFor="notebook-status-field">Status</label>
              <select id="notebook-status-field" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
                <option value="Em Estoque">Em estoque</option>
                <option value="Em Uso">Em uso</option>
                <option value="Manutencao">Manutenção</option>
              </select>
            </div>
            <div className="input-group">
              <label htmlFor="notebook-location">Localização</label>
              <input id="notebook-location" value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} />
            </div>
            <div className="input-group">
              <label htmlFor="notebook-entry-date">Data de entrada</label>
              <input id="notebook-entry-date" type="date" value={form.entryDate} onChange={(event) => setForm((current) => ({ ...current, entryDate: event.target.value }))} />
            </div>
          </div>

          <div className="inline-actions">
            <button className="primary-button" type="submit">
              {selectedId ? "Atualizar portátil" : "Criar portátil"}
            </button>
            <button className="danger-button" type="button" onClick={removeNotebook} disabled={!selectedId}>
              Excluir selecionado
            </button>
          </div>
        </form>
      </SectionCard>
    </ProtectedPage >
  );
}
