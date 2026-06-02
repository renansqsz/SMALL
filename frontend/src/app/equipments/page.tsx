"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";

import { ProtectedPage } from "@/components/protected-page";
import { SectionCard } from "@/components/section-card";
import { useTimedNotice } from "@/components/form-toast";
import { StatusPill } from "@/components/status-pill";
import { HistoryIcon } from "@/components/action-icons";
import { CustomSelect } from "@/components/custom-select";
import { ApiError, deleteJson, downloadFile, getJson, postJson, putJson } from "@/lib/api";
import { validateFormWithFeedback } from "@/lib/form-validation";
import {
  equipmentStatusTone,
  translateEquipmentStatus,
  translateMovementType,
} from "@/lib/pt-br";
import type { EmployeeBase, Equipment, EquipmentHistoryItem } from "@/lib/types";

type EquipmentForm = {
  name: string;
  category: string;
  brand: string;
  model: string;
  serialNumber: string;
  totalQuantity: number;
  availableQuantity: number;
  location: string;
  entryDate: string;
};

type AssignForm = {
  equipmentId: number;
  employeeId: number;
  office: string;
  quantity: number;
};

type UnassignOption = {
  employeeId: number;
  employeeName: string;
  office: string;
  quantity: number;
};

const today = () => new Date().toISOString().slice(0, 10);

const emptyEquipmentForm: EquipmentForm = {
  name: "",
  category: "",
  brand: "",
  model: "",
  serialNumber: "",
  totalQuantity: 0,
  availableQuantity: 0,
  location: "",
  entryDate: today(),
};

const emptyAssignForm: AssignForm = {
  equipmentId: 0,
  employeeId: 0,
  office: "",
  quantity: 1,
};

function formatDate(value: string) {
  return value ? value.slice(0, 10) : today();
}

function groupAssignments(items: EquipmentHistoryItem[]): UnassignOption[] {
  const map = new Map<number, UnassignOption>();

  for (const item of items.filter((entry) => entry.movementType === "Atribuicao")) {
    const current = map.get(item.employeeId);
    if (current) {
      current.quantity += Number(item.quantity);
      continue;
    }

    map.set(item.employeeId, {
      employeeId: item.employeeId,
      employeeName: item.employeeName,
      office: item.office,
      quantity: Number(item.quantity),
    });
  }

  return Array.from(map.values()).sort((left, right) => left.employeeName.localeCompare(right.employeeName, "pt-BR"));
}

export default function EquipmentsPage() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [employees, setEmployees] = useState<EmployeeBase[]>([]);
  const [offices, setOffices] = useState<string[]>([]);
  const [history, setHistory] = useState<EquipmentHistoryItem[]>([]);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number>(0);
  const [historyEquipmentId, setHistoryEquipmentId] = useState<number>(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ search: "", status: "Todos" });
  const [form, setForm] = useState<EquipmentForm>(emptyEquipmentForm);
  const [assignForm, setAssignForm] = useState<AssignForm>(emptyAssignForm);
  const [unassignEquipment, setUnassignEquipment] = useState<Equipment | null>(null);
  const [unassignOptions, setUnassignOptions] = useState<UnassignOption[]>([]);
  const [unassignForm, setUnassignForm] = useState({ employeeId: 0, quantity: 1 });
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { notice, showNotice } = useTimedNotice();

  function notifyError(message: string) {
    setError(message);
  }
  const deferredSearch = useDeferredValue(filters.search);

  async function loadPage() {
    const [equipmentData, categoryData, employeeData, officeData] = await Promise.all([
      getJson<Equipment[]>("/equipments"),
      getJson<{ id: number; name: string }[]>("/categories"),
      getJson<EmployeeBase[]>("/employees/base"),
      getJson<string[]>("/employees/offices"),
    ]);
    setEquipments(equipmentData);
    setCategories(categoryData);
    setEmployees(employeeData);
    setOffices(officeData);
  }

  useEffect(() => {
    let mounted = true;
    async function bootstrap() {
      try {
        await loadPage();
      } catch {
        if (mounted) {
          setError("Não foi possível carregar os equipamentos.");
        }
      }
    }
    void bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const current = equipments.find((item) => item.id === selectedEquipmentId);
    if (!current) {
      setForm({
        ...emptyEquipmentForm,
        category: "",
      });
      return;
    }

    setForm({
      name: current.name,
      category: current.category,
      brand: current.brand ?? "",
      model: current.model ?? "",
      serialNumber: current.serialNumber ?? "",
      totalQuantity: Number(current.totalQuantity),
      availableQuantity: Number(current.availableQuantity),
      location: current.location ?? "",
      entryDate: formatDate(current.entryDate),
    });
  }, [equipments, selectedEquipmentId]);

  useEffect(() => {
    let mounted = true;

    async function loadHistory() {
      if (!historyEquipmentId) {
        if (mounted) {
          setHistory([]);
          setHistoryError(null);
          setHistoryLoading(false);
        }
        return;
      }

      if (mounted) {
        setHistoryLoading(true);
        setHistoryError(null);
      }

      try {
        const payload = await getJson<EquipmentHistoryItem[]>(`/equipments/${historyEquipmentId}/history`);
        if (mounted) {
          setHistory(payload);
        }
      } catch (caughtError) {
        if (mounted) {
          setHistory([]);
        }
        if (!mounted) {
          return;
        }
        setHistoryError(caughtError instanceof ApiError ? caughtError.message : "Não foi possível carregar o histórico do equipamento.");
      } finally {
        if (mounted) {
          setHistoryLoading(false);
        }
      }
    }

    void loadHistory();
    return () => {
      mounted = false;
    };
  }, [historyEquipmentId]);

  useEffect(() => {
    if (error) {
      showNotice(error, { tone: "error" });
    }
  }, [error, showNotice]);

  useEffect(() => {
    if (historyError) {
      showNotice(historyError, { tone: "error" });
    }
  }, [historyError, showNotice]);

  function focusAssignSection(equipmentId: number) {
    setAssignForm((current) => ({
      ...current,
      equipmentId,
      office: "",
      employeeId: 0,
      quantity: 1,
    }));

    window.setTimeout(() => {
      document.getElementById("assign-equipment-card")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  }

  function focusHistorySection(equipmentId: number) {
    setHistoryEquipmentId(equipmentId);

    window.setTimeout(() => {
      document.getElementById("history-equipment-card")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  }

  async function openUnassignDialog(item: Equipment) {
    setError(null);
    setActionLoading(true);

    try {
      const payload = await getJson<EquipmentHistoryItem[]>(`/equipments/${item.id}/history`);
      const options = groupAssignments(payload);
      if (options.length === 0) {
        setError("Este equipamento não possui alocações ativas para desatribuição.");
        return;
      }

      setUnassignEquipment(item);
      setUnassignOptions(options);
      setUnassignForm({
        employeeId: 0,
        quantity: 1,
      });
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Não foi possível carregar as alocações do equipamento.");
    } finally {
      setActionLoading(false);
    }
  }

  function closeUnassignDialog() {
    setUnassignEquipment(null);
    setUnassignOptions([]);
    setUnassignForm({ employeeId: 0, quantity: 1 });
  }

  async function handleUnassignSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateFormWithFeedback(event.currentTarget, showNotice)) {
      return;
    }

    if (!unassignEquipment || !unassignForm.employeeId) {
      notifyError("Selecione um colaborador para desatribuir o item.");
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      await postJson(`/employees/${unassignForm.employeeId}/unassign`, {
        equipmentId: unassignEquipment.id,
        quantity: unassignForm.quantity,
      });
      closeUnassignDialog();
      await reloadWithMessage("Equipamento desatribuído com sucesso.");
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Não foi possível desatribuir o equipamento.");
    } finally {
      setActionLoading(false);
    }
  }

  const normalizedSearch = deferredSearch.trim().toLowerCase();
  const filteredEquipments = useMemo(
    () =>
      equipments.filter((item) => {
        const matchesSearch = [item.name, item.category, item.serialNumber, item.location].join(" ").toLowerCase().includes(normalizedSearch);
        const matchesStatus = filters.status === "Todos" || item.status === filters.status;
        return matchesSearch && matchesStatus;
      }),
    [equipments, filters.status, normalizedSearch],
  );

  async function reloadWithMessage(nextMessage: string) {
    await loadPage();
    if (historyEquipmentId) {
      try {
        const payload = await getJson<EquipmentHistoryItem[]>(`/equipments/${historyEquipmentId}/history`);
        setHistory(payload);
        setHistoryError(null);
      } catch (caughtError) {
        setHistory([]);
        setHistoryError(caughtError instanceof ApiError ? caughtError.message : "Não foi possível carregar o histórico do equipamento.");
      }
    }
    showNotice(nextMessage);
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateFormWithFeedback(event.currentTarget, showNotice)) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (selectedEquipmentId) {
        await putJson(`/equipments/${selectedEquipmentId}`, form);
        await reloadWithMessage("Equipamento atualizado com sucesso.");
      } else {
        await postJson("/equipments", form);
        await reloadWithMessage("Equipamento criado com sucesso.");
      }
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Não foi possível salvar o equipamento.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedEquipmentId) {
      notifyError("Selecione um equipamento primeiro.");
      return;
    }

    try {
      await deleteJson(`/equipments/${selectedEquipmentId}`);
      setSelectedEquipmentId(0);
      setHistoryEquipmentId(0);
      setHistory([]);
      setHistoryError(null);
      await reloadWithMessage("Equipamento excluído com sucesso.");
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Não foi possível excluir o equipamento.");
    }
  }

  async function handleAssign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateFormWithFeedback(event.currentTarget, showNotice)) {
      return;
    }

    setError(null);

    if (!assignForm.equipmentId || !assignForm.employeeId || !assignForm.office) {
      showNotice("Preencha todos os campos da atribuição antes de enviar.", { tone: "error" });
      return;
    }

    if (selectedAssignEquipment && assignForm.quantity > Number(selectedAssignEquipment.availableQuantity)) {
      showNotice(`Quantidade indisponivel para atribuicao. Restam ${selectedAssignEquipment.availableQuantity} unidades disponiveis.`, { tone: "error" });
      return;
    }

    try {
      await postJson(`/equipments/${assignForm.equipmentId}/assign`, {
        employeeId: assignForm.employeeId,
        quantity: assignForm.quantity,
        office: assignForm.office,
      });
      setAssignForm(emptyAssignForm);
      await reloadWithMessage("Equipamento atribuído com sucesso.");
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Não foi possível atribuir o equipamento.");
    }
  }

  const employeesForOffice = useMemo(
    () => (assignForm.office ? employees.filter((employee) => employee.escritorio === assignForm.office) : employees),
    [assignForm.office, employees],
  );
  const selectedAssignEquipment = useMemo(
    () => equipments.find((item) => item.id === assignForm.equipmentId) ?? null,
    [assignForm.equipmentId, equipments],
  );
  const selectedUnassignOption = useMemo(
    () => unassignOptions.find((item) => item.employeeId === unassignForm.employeeId) ?? null,
    [unassignForm.employeeId, unassignOptions],
  );

  return (
    <ProtectedPage
      title="Equipamentos"
      description="Gerencie os equipamentos da empresa, filtre, crie, edite e visualize o histórico de alocações."

      notice={notice}
      actions={
        <button className="secondary-button" type="button" onClick={() => void downloadFile("/exports/equipments", "equipments.xlsx")}>
          Exportar Excel
        </button>
      }
    >
      {error ? <div className="message error">{error}</div> : null}

      <SectionCard title="Tabela de inventário" copy="Pesquise os registros atuais e monitore a disponibilidade de quantidades.">
        <div className="toolbar equipment-toolbar">
          <div className="toolbar-group">
            <div className="input-group">
              <label htmlFor="equipment-search">Pesquisar</label>
              <input
                id="equipment-search"
                placeholder="Nome, categoria, serial ou localização"
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              />
            </div>
            <div className="input-group">
              <label htmlFor="equipment-status">Status</label>
              <CustomSelect
                id="equipment-status"
                value={filters.status}
                onValueChange={(value) => setFilters((current) => ({ ...current, status: value }))}
                options={[
                  { value: "Todos", label: "Todos" },
                  { value: "Em estoque", label: "Em estoque" },
                  { value: "Em falta", label: "Em falta" },
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
                <th>Nome</th>
                <th>Categoria</th>
                <th>Disponível</th>
                <th>Total</th>
                <th>Status</th>
                <th>Localização</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {filteredEquipments.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{item.availableQuantity}</td>
                  <td>{item.totalQuantity}</td>
                  <td>
                    <StatusPill tone={equipmentStatusTone(item.status)} value={translateEquipmentStatus(item.status)} />
                  </td>
                  <td>{item.location}</td>
                  <td>
                    <div className="equipment-action-group">
                      {item.availableQuantity > 0 ? (
                        <button className="table-action-button assign" type="button" onClick={() => focusAssignSection(item.id)}>
                          Atribuir
                        </button>
                      ) : null}
                      {Number(item.totalQuantity) - Number(item.availableQuantity) > 0 ? (
                        <button
                          className="table-action-button unassign"
                          type="button"
                          onClick={() => void openUnassignDialog(item)}
                          disabled={actionLoading}
                        >
                          Desatribuir
                        </button>
                      ) : null}
                      <button
                        className="icon-button success"
                        type="button"
                        onClick={() => focusHistorySection(item.id)}
                        title="Ver histórico"
                        aria-label={`Ver histórico do equipamento ${item.name}`}
                      >
                        <HistoryIcon className="button-icon-svg" />
                      </button>
                      {item.availableQuantity <= 0 && Number(item.totalQuantity) - Number(item.availableQuantity) <= 0 ? (
                        <span className="action-placeholder">Sem ação</span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <div className="split-grid">
        <div id="assign-equipment-card">
          <SectionCard title="Criar ou editar" copy="O equipamento selecionado preenche o formulário para edição.">
            <div className="input-group">
              <label htmlFor="equipment-picker">Registro atual*</label>
              <CustomSelect
                id="equipment-picker"
                value={String(selectedEquipmentId)}
                onValueChange={(value) => setSelectedEquipmentId(Number(value))}
                options={[
                  { value: "0", label: "Novo equipamento" },
                  ...equipments.map((item) => ({ value: String(item.id), label: `#${item.id} - ${item.name}` })),
                ]}
              />
            </div>

            <form className="stack" onSubmit={handleSubmit} noValidate>
              <div className="input-grid equipment-form-grid">
                <div className="input-group">
                  <label htmlFor="equipment-name">Nome*</label>
                  <input id="equipment-name" required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
                </div>
                <div className="input-group">
                  <label htmlFor="equipment-category">Categoria*</label>
                  <CustomSelect
                    id="equipment-category"
                    required
                    value={form.category}
                    onValueChange={(value) => setForm((current) => ({ ...current, category: value }))}
                    options={[
                      { value: "", label: "Selecione uma categoria" },
                      ...categories.map((item) => ({ value: item.name, label: item.name })),
                    ]}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="equipment-brand">Marca*</label>
                  <input id="equipment-brand" required value={form.brand} onChange={(event) => setForm((current) => ({ ...current, brand: event.target.value }))} />
                </div>
                <div className="input-group">
                  <label htmlFor="equipment-model">Modelo*</label>
                  <input id="equipment-model" required value={form.model} onChange={(event) => setForm((current) => ({ ...current, model: event.target.value }))} />
                </div>
                <div className="input-group">
                  <label htmlFor="equipment-serial">Número de série*</label>
                  <input id="equipment-serial" required value={form.serialNumber} onChange={(event) => setForm((current) => ({ ...current, serialNumber: event.target.value }))} />
                </div>
                <div className="input-group">
                  <label htmlFor="equipment-date">Data de entrada*</label>
                  <input id="equipment-date" type="date" required value={form.entryDate} onChange={(event) => setForm((current) => ({ ...current, entryDate: event.target.value }))} />
                </div>
                <div className="input-group">
                  <label htmlFor="equipment-total">Quantidade total*</label>
                  <input
                    id="equipment-total"
                    type="number"
                    required
                    min={0}
                    value={form.totalQuantity}
                    onChange={(event) => setForm((current) => ({ ...current, totalQuantity: Number(event.target.value) }))}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="equipment-available">Quantidade disponível*</label>
                  <input
                    id="equipment-available"
                    type="number"
                    required
                    min={0}
                    value={form.availableQuantity}
                    onChange={(event) => setForm((current) => ({ ...current, availableQuantity: Number(event.target.value) }))}
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="equipment-location">Setor*</label>
                <input id="equipment-location" required value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} />
              </div>

              <div className="inline-actions">
                <button className="primary-button" type="submit" disabled={saving}>
                  {saving ? "Salvando..." : selectedEquipmentId ? "Atualizar equipamento" : "Criar equipamento"}
                </button>
                <button className="danger-button" type="button" onClick={handleDelete} disabled={!selectedEquipmentId}>
                  Excluir selecionado
                </button>
              </div>
            </form>
          </SectionCard>
        </div>

        <SectionCard title="Atribuir equipamento" copy="Use o filtro por escritório para encontrar o colaborador correto.">
          <form className="stack" onSubmit={handleAssign} noValidate>
            <div className="input-group">
              <label htmlFor="assign-equipment">Equipamento*</label>
              <CustomSelect
                id="assign-equipment"
                required
                value={assignForm.equipmentId === 0 ? "" : String(assignForm.equipmentId)}
                onValueChange={(value) => setAssignForm((current) => ({ ...current, equipmentId: Number(value) }))}
                options={[
                  { value: "", label: "Selecione um equipamento" },
                  ...equipments.map((item) => ({ value: String(item.id), label: `#${item.id} - ${item.name} (${item.availableQuantity} disponíveis)` })),
                ]}
              />
            </div>

            <div className="input-grid">
              <div className="input-group">
                <label htmlFor="assign-office">Escritório*</label>
                <CustomSelect
                  id="assign-office"
                  required
                  value={assignForm.office}
                  onValueChange={(value) => setAssignForm((current) => ({ ...current, office: value, employeeId: 0 }))}
                  options={[
                    { value: "", label: "Selecione um escritório" },
                    ...offices.map((office) => ({ value: office, label: office })),
                  ]}
                />
              </div>

              <div className="input-group">
                <label htmlFor="assign-employee">Colaborador*</label>
                <CustomSelect
                  id="assign-employee"
                  required
                  value={assignForm.employeeId === 0 ? "" : String(assignForm.employeeId)}
                  onValueChange={(value) => setAssignForm((current) => ({ ...current, employeeId: Number(value) }))}
                  options={[
                    { value: "", label: "Selecione um colaborador" },
                    ...employeesForOffice.map((item) => ({ value: String(item.id), label: item.nome })),
                  ]}
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="assign-quantity">Quantidade*</label>
              <input
                id="assign-quantity"
                type="number"
                required
                min={1}
                value={assignForm.quantity}
                onChange={(event) => setAssignForm((current) => ({ ...current, quantity: Number(event.target.value) }))}
              />
            </div>

            <button className="primary-button" type="submit">
              Confirmar atribuição
            </button>
          </form>
        </SectionCard>
      </div>

      <div id="history-equipment-card">
        <SectionCard title="Histórico de equipamentos" copy="Acompanhe as atribuições e devoluções registradas para cada item.">
          <div className="input-group" style={{ marginBottom: "1rem" }}>
            <label htmlFor="history-equipment">Equipamento</label>
            <CustomSelect
              id="history-equipment"
              value={String(historyEquipmentId)}
              onValueChange={(value) => setHistoryEquipmentId(Number(value))}
              options={[
                { value: "0", label: "Selecione um equipamento" },
                ...equipments.map((item) => ({ value: String(item.id), label: `#${item.id} - ${item.name}` })),
              ]}
            />
          </div>

          {historyLoading ? (
            <div className="empty-state">Carregando histórico...</div>
          ) : historyError ? (
            <div className="message error">{historyError}</div>
          ) : historyEquipmentId === 0 ? (
            <div className="empty-state">Selecione um equipamento para ver o histórico.</div>
          ) : history.length === 0 ? (
            <div className="empty-state">Nenhum registro de histórico foi encontrado para o equipamento selecionado.</div>
          ) : (
            <div className="table-shell">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Colaborador</th>
                    <th>Escritório</th>
                    <th>Quantidade</th>
                    <th>Movimentação</th>
                    <th>Criado</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id}>
                      <td>{item.employeeName}</td>
                      <td>{item.office}</td>
                      <td>{item.quantity}</td>
                      <td>{translateMovementType(item.movementType)}</td>
                      <td>{item.createdAt.slice(0, 19).replace("T", " ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      {unassignEquipment ? (
        <div className="modal-backdrop" role="presentation" onClick={closeUnassignDialog}>
          <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="unassign-modal-title" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 id="unassign-modal-title" className="modal-title">
                  Desatribuir equipamento
                </h3>
                <p className="panel-copy">
                  Selecione o colaborador e a quantidade para devolver o item com base nas alocações ativas.
                </p>
              </div>
              <button className="ghost-button modal-close" type="button" onClick={closeUnassignDialog}>
                Fechar
              </button>
            </div>

            <div className="assignment-summary">
              <div className="assignment-tile">
                <div className="assignment-tile-label">Equipamento</div>
                <div className="assignment-tile-value">{unassignEquipment.name}</div>
              </div>
              <div className="assignment-tile">
                <div className="assignment-tile-label">Quantidade alocada</div>
                <div className="assignment-tile-value">{Number(unassignEquipment.totalQuantity) - Number(unassignEquipment.availableQuantity)}</div>
              </div>
            </div>

            <form className="stack" onSubmit={handleUnassignSubmit} noValidate>
              <div className="input-group">
                <label htmlFor="unassign-employee">Colaborador</label>
                <CustomSelect
                  id="unassign-employee"
                  required
                  disabled={actionLoading}
                  value={unassignForm.employeeId === 0 ? "" : String(unassignForm.employeeId)}
                  onValueChange={(value) => setUnassignForm({ employeeId: Number(value), quantity: 1 })}
                  options={[
                    { value: "", label: "Selecione um colaborador" },
                    ...unassignOptions.map((item) => ({
                      value: String(item.employeeId),
                      label: `${item.employeeName} (${item.office}) - ${item.quantity} disponíveis`,
                    })),
                  ]}
                />
              </div>

              <div className="input-group">
                <label htmlFor="unassign-quantity">Quantidade</label>
                <input
                  id="unassign-quantity"
                  type="number"
                  required
                  min={1}
                  max={selectedUnassignOption?.quantity ?? 1}
                  value={unassignForm.quantity}
                  onChange={(event) => setUnassignForm((current) => ({ ...current, quantity: Number(event.target.value) }))}
                  disabled={actionLoading}
                />
              </div>

              <div className="inline-actions">
                <button className="primary-button" type="submit" disabled={actionLoading}>
                  {actionLoading ? "Processando..." : "Confirmar desatribuição"}
                </button>
                <button className="danger-button cancel-button" type="button" onClick={closeUnassignDialog} disabled={actionLoading}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </ProtectedPage>
  );
}
