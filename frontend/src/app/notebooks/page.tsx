"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";

import { EyeIcon, PencilIcon, TrashIcon } from "@/components/action-icons";
import { CustomSelect } from "@/components/custom-select";
import { ProtectedPage } from "@/components/protected-page";
import { SectionCard } from "@/components/section-card";
import { useTimedNotice } from "@/components/form-toast";
import { StatusPill } from "@/components/status-pill";
import { ApiError, deleteJson, downloadFile, getJson, postJson, putJson } from "@/lib/api";
import { validateFormWithFeedback } from "@/lib/form-validation";
import { notebookStatusTone, translateNotebookCondition, translateNotebookStatus } from "@/lib/pt-br";
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

function formatNotebookDate(value: string) {
  return value ? value.slice(0, 10) : "-";
}

export default function NotebooksPage() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [selectedId, setSelectedId] = useState<number>(0);
  const [filters, setFilters] = useState({ search: "", status: "Todos" });
  const [form, setForm] = useState<NotebookForm>(notebookDefaults);
  const [error, setError] = useState<string | null>(null);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const { notice, showNotice } = useTimedNotice();

  const deferredSearch = useDeferredValue(filters.search);

  async function loadNotebooks() {
    const payload = await getJson<Notebook[]>("/notebooks");
    setNotebooks(payload);
  }

  useEffect(() => {
    void loadNotebooks().catch(() => setError("Não foi possível carregar os notebooks."));
  }, []);

  useEffect(() => {
    if (error) {
      showNotice(error, { tone: "error" });
    }
  }, [error, showNotice]);

  const selectedNotebook = useMemo(
    () => notebooks.find((item) => item.id === selectedId) ?? null,
    [notebooks, selectedId],
  );

  useEffect(() => {
    const current = selectedNotebook;
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
  }, [selectedNotebook]);

  const normalizedSearch = deferredSearch.trim().toLowerCase();
  const filteredNotebooks = useMemo(
    () =>
      notebooks.filter((item) => {
        const matchesSearch = [item.brand, item.model, item.serialNumber, item.processor, item.gpu, item.location].join(" ").toLowerCase().includes(normalizedSearch);
        const matchesStatus = filters.status === "Todos" || item.status === filters.status;
        return matchesSearch && matchesStatus;
      }),
    [filters.status, normalizedSearch, notebooks],
  );

  function focusNotebook(notebookId: number) {
    setSelectedId(notebookId);
    setError(null);
    setIsCatalogOpen(false);

    window.setTimeout(() => {
      document.getElementById("notebook-form-card")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  }

  async function saveNotebook(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateFormWithFeedback(event.currentTarget, showNotice)) {
      return;
    }

    setError(null);

    try {
      if (selectedId) {
        await putJson(`/notebooks/${selectedId}`, form);
        showNotice("Notebook atualizado com sucesso.");
      } else {
        await postJson("/notebooks", form);
        showNotice("Notebook criado com sucesso.");
      }

      await loadNotebooks();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Não foi possível salvar o notebook.");
    }
  }

  async function handleDeleteNotebook(notebookId: number) {
    setError(null);

    try {
      await deleteJson(`/notebooks/${notebookId}`);
      if (selectedId === notebookId) {
        setSelectedId(0);
      }
      showNotice("Notebook excluído com sucesso.");
      await loadNotebooks();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Não foi possível excluir o notebook.");
    }
  }

  function openCatalog() {
    setIsCatalogOpen(true);
  }

  function closeCatalog() {
    setIsCatalogOpen(false);
  }

  function renderNotebookActions(item: Notebook) {
    return (
      <div className="table-actions">
        <button
          className="icon-button primary"
          type="button"
          onClick={() => focusNotebook(item.id)}
          title="Editar notebook"
          aria-label={`Editar notebook ${item.brand} ${item.model}`}
        >
          <PencilIcon className="button-icon-svg" />
        </button>
        <button
          className="icon-button danger"
          type="button"
          onClick={() => void handleDeleteNotebook(item.id)}
          title="Excluir notebook"
          aria-label={`Excluir notebook ${item.brand} ${item.model}`}
        >
          <TrashIcon className="button-icon-svg" />
        </button>
      </div>
    );
  }

  return (
    <ProtectedPage
      title="Notebooks"
      description="Gerencie os notebooks da empresa, filtre, crie, edite e visualize o histórico de alocações."
      notice={notice}
      actions={
        <button className="secondary-button" type="button" onClick={() => void downloadFile("/exports/notebooks", "notebooks.xlsx")}>
          Exportar Excel
        </button>
      }
    >
      {error ? <div className="message error">{error}</div> : null}

      <SectionCard
        title="Inventário de Notebooks"
        copy="Filtre o catálogo atual por status ou termos de hardware."
        actions={
          <button className="secondary-button" type="button" onClick={openCatalog}>
            <span className="button-icon" aria-hidden="true">
              <EyeIcon className="button-icon-svg" />
            </span>
            Visualizar todos os notebooks
          </button>
        }
      >
        <div className="toolbar notebook-toolbar">
          <div className="toolbar-group">
            <div className="input-group">
              <label htmlFor="notebook-search">Pesquisar</label>
              <input
                id="notebook-search"
                placeholder="Marca, modelo, serial, processador, GPU ou localização"
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              />
            </div>
            <div className="input-group">
              <label htmlFor="notebook-status">Status</label>
              <CustomSelect
                id="notebook-status"
                value={filters.status}
                onValueChange={(value) => setFilters((current) => ({ ...current, status: value }))}
                options={[
                  { value: "Todos", label: "Todos" },
                  { value: "Em Estoque", label: "Em estoque" },
                  { value: "Em Uso", label: "Em uso" },
                  { value: "Manutencao", label: "Manutenção" },
                ]}
              />
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
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotebooks.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">Nenhum notebook encontrado.</div>
                  </td>
                </tr>
              ) : (
                filteredNotebooks.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.brand}</td>
                    <td>{item.model}</td>
                    <td>{item.processor}</td>
                    <td>{item.ramTotal} GB</td>
                    <td>
                      <StatusPill tone={notebookStatusTone(item.status)} value={translateNotebookStatus(item.status)} />
                    </td>
                    <td>{renderNotebookActions(item)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <div id="notebook-form-card">
        <SectionCard title="Criar ou editar notebook" copy="Escolha um notebook existente ou abra um novo formulário.">
          <div className="input-group">
            <label htmlFor="notebook-picker">Registro atual</label>
            <CustomSelect
              id="notebook-picker"
              value={String(selectedId)}
              onValueChange={(value) => setSelectedId(Number(value))}
              options={[
                { value: "0", label: "Novo notebook" },
                ...notebooks.map((item) => ({
                  value: String(item.id),
                  label: `#${item.id} - ${item.brand} ${item.model} | ${item.processor} | ${item.location}`,
                })),
              ]}
            />
          </div>

          <form className="stack" onSubmit={saveNotebook} noValidate>
            <div className="input-grid notebook-form-grid">
              <div className="input-group">
                <label htmlFor="notebook-brand">Marca*</label>
                <input id="notebook-brand" required value={form.brand} onChange={(event) => setForm((current) => ({ ...current, brand: event.target.value }))} />
              </div>
              <div className="input-group">
                <label htmlFor="notebook-model">Modelo*</label>
                <input id="notebook-model" required value={form.model} onChange={(event) => setForm((current) => ({ ...current, model: event.target.value }))} />
              </div>
              <div className="input-group">
                <label htmlFor="notebook-serial">Número de série*</label>
                <input id="notebook-serial" required value={form.serialNumber} onChange={(event) => setForm((current) => ({ ...current, serialNumber: event.target.value }))} />
              </div>
              <div className="input-group">
                <label htmlFor="notebook-processor">Processador*</label>
                <input id="notebook-processor" required value={form.processor} onChange={(event) => setForm((current) => ({ ...current, processor: event.target.value }))} />
              </div>
              <div className="input-group">
                <label htmlFor="notebook-gpu">GPU*</label>
                <input id="notebook-gpu" required value={form.gpu} onChange={(event) => setForm((current) => ({ ...current, gpu: event.target.value }))} />
              </div>
              <div className="input-group">
                <label htmlFor="notebook-screen">Tela*</label>
                <input id="notebook-screen" required value={form.screenSize} onChange={(event) => setForm((current) => ({ ...current, screenSize: event.target.value }))} />
              </div>
              <div className="input-group">
                <label htmlFor="notebook-ram">RAM total*</label>
                <input id="notebook-ram" type="number" required min={0} value={form.ramTotal} onChange={(event) => setForm((current) => ({ ...current, ramTotal: Number(event.target.value) }))} />
              </div>
              <div className="input-group">
                <label htmlFor="notebook-ram-sticks">Pentes de RAM*</label>
                <input id="notebook-ram-sticks" type="number" required min={0} value={form.ramSticks} onChange={(event) => setForm((current) => ({ ...current, ramSticks: Number(event.target.value) }))} />
              </div>
              <div className="input-group">
                <label htmlFor="notebook-storage-type">Tipo de armazenamento*</label>
                <CustomSelect
                  id="notebook-storage-type"
                  required
                  value={form.storageType}
                  onValueChange={(value) => setForm((current) => ({ ...current, storageType: value }))}
                  options={[
                    { value: "SSD", label: "SSD" },
                    { value: "HD", label: "HD" },
                    { value: "NVMe", label: "NVMe" },
                    { value: "SSD + HD", label: "SSD + HD" },
                  ]}
                />
              </div>
              <div className="input-group">
                <label htmlFor="notebook-storage-capacity">Capacidade de armazenamento*</label>
                <input id="notebook-storage-capacity" required value={form.storageCapacity} onChange={(event) => setForm((current) => ({ ...current, storageCapacity: event.target.value }))} />
              </div>
              <div className="input-group">
                <label htmlFor="notebook-condition">Condição*</label>
                <CustomSelect
                  id="notebook-condition"
                  required
                  value={form.condition}
                  onValueChange={(value) => setForm((current) => ({ ...current, condition: value }))}
                  options={[
                    { value: "Novo", label: "Novo" },
                    { value: "Bom", label: "Bom" },
                    { value: "Razoavel", label: "Razoável" },
                    { value: "Com Defeito", label: "Com defeito" },
                  ]}
                />
              </div>
              <div className="input-group">
                <label htmlFor="notebook-status-field">Status*</label>
                <CustomSelect
                  id="notebook-status-field"
                  required
                  value={form.status}
                  onValueChange={(value) => setForm((current) => ({ ...current, status: value }))}
                  options={[
                    { value: "Em Estoque", label: "Em estoque" },
                    { value: "Em Uso", label: "Em uso" },
                    { value: "Manutencao", label: "Manutenção" },
                  ]}
                />
              </div>
              <div className="input-group">
                <label htmlFor="notebook-location">Localização*</label>
                <input id="notebook-location" required value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} />
              </div>
              <div className="input-group">
                <label htmlFor="notebook-entry-date">Data de entrada*</label>
                <input id="notebook-entry-date" type="date" required value={form.entryDate} onChange={(event) => setForm((current) => ({ ...current, entryDate: event.target.value }))} />
              </div>
            </div>

            <div className="inline-actions">
              <button className="primary-button" type="submit">
                {selectedId ? "Atualizar notebook" : "Criar notebook"}
              </button>
              <button className="danger-button" type="button" onClick={() => void handleDeleteNotebook(selectedId)} disabled={!selectedId}>
                Excluir selecionado
              </button>
            </div>
          </form>
        </SectionCard>
      </div>

      {isCatalogOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={closeCatalog}>
          <div
            className="modal-card notebook-catalog-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="notebook-catalog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3 id="notebook-catalog-title" className="modal-title">
                  Todos os notebooks
                </h3>
                <p className="panel-copy">Visualização completa do inventário, com todos os campos usados na edição.</p>
              </div>
              <button className="ghost-button modal-close" type="button" onClick={closeCatalog}>
                Fechar
              </button>
            </div>

            {notebooks.length === 0 ? (
              <div className="empty-state">Nenhum notebook cadastrado.</div>
            ) : (
              <div className="table-shell notebook-full-table-shell">
                <table className="data-table notebook-full-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Marca</th>
                      <th>Modelo</th>
                      <th>Serial</th>
                      <th>Processador</th>
                      <th>GPU</th>
                      <th>Tela</th>
                      <th>RAM total</th>
                      <th>Pentes</th>
                      <th>Armazenamento</th>
                      <th>Capacidade</th>
                      <th>Condição</th>
                      <th>Localização</th>
                      <th>Status</th>
                      <th>Entrada</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notebooks.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>{item.brand}</td>
                        <td>{item.model}</td>
                        <td>{item.serialNumber || "-"}</td>
                        <td>{item.processor || "-"}</td>
                        <td>{item.gpu || "-"}</td>
                        <td>{item.screenSize || "-"}</td>
                        <td>{item.ramTotal} GB</td>
                        <td>{item.ramSticks}</td>
                        <td>{item.storageType || "-"}</td>
                        <td>{item.storageCapacity || "-"}</td>
                        <td>{translateNotebookCondition(item.condition)}</td>
                        <td>{item.location || "-"}</td>
                        <td>
                          <StatusPill tone={notebookStatusTone(item.status)} value={translateNotebookStatus(item.status)} />
                        </td>
                        <td>{formatNotebookDate(item.entryDate)}</td>
                        <td>{renderNotebookActions(item)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </ProtectedPage>
  );
}
