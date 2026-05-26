"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";

import { ProtectedPage } from "@/components/protected-page";
import { SectionCard } from "@/components/section-card";
import { useTimedNotice } from "@/components/form-toast";
import { ApiError, deleteJson, downloadFile, getJson, postJson, putJson } from "@/lib/api";
import { validateFormWithFeedback } from "@/lib/form-validation";
import type { Employee } from "@/lib/types";

type EmployeeForm = {
  nome: string;
  escritorio: string;
};

const emptyForm: EmployeeForm = {
  nome: "",
  escritorio: "",
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [offices, setOffices] = useState<string[]>([]);
  const [filters, setFilters] = useState({ search: "", office: "Todos" });
  const [employeePage, setEmployeePage] = useState(1);
  const [selectedId, setSelectedId] = useState<number>(0);
  const [detailsId, setDetailsId] = useState<number>(0);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const [unassign, setUnassign] = useState({ equipmentId: 0, quantity: 1 });
  const [error, setError] = useState<string | null>(null);
  const { notice, showNotice } = useTimedNotice();

  function notifyError(message: string) {
    setError(message);
  }
  const deferredSearch = useDeferredValue(filters.search);

  async function loadEmployees() {
    const [employeeData, officeData] = await Promise.all([
      getJson<Employee[]>("/employees"),
      getJson<string[]>("/employees/offices"),
    ]);
    setEmployees(employeeData);
    setOffices(officeData);
  }

  useEffect(() => {
    void loadEmployees().catch(() => setError("Não foi possível carregar os colaboradores."));
  }, []);

  useEffect(() => {
    if (error) {
      showNotice(error, { tone: "error" });
    }
  }, [error, showNotice]);

  useEffect(() => {
    const current = employees.find((item) => item.id === selectedId);
    if (!current) {
      setForm(emptyForm);
      return;
    }
    setForm({ nome: current.nome, escritorio: current.escritorio });
  }, [employees, selectedId]);

  const employeesPerPage = 5;
  const normalizedSearch = deferredSearch.trim().toLowerCase();
  const employeesById = useMemo(() => new Map(employees.map((item) => [item.id, item])), [employees]);
  const filteredEmployees = useMemo(
    () =>
      employees.filter((employee) => {
        const matchesOffice = filters.office === "Todos" || employee.escritorio === filters.office;
        const matchesSearch = [employee.nome, employee.escritorio].join(" ").toLowerCase().includes(normalizedSearch);
        return matchesOffice && matchesSearch;
      }),
    [employees, filters.office, normalizedSearch],
  );
  const employeesWithTotals = useMemo(
    () =>
      filteredEmployees.map((employee) => ({
        ...employee,
        totalAssigned: employee.items.reduce((sum, item) => sum + Number(item.quantity), 0),
      })),
    [filteredEmployees],
  );
  const totalEmployeePages = Math.max(1, Math.ceil(filteredEmployees.length / employeesPerPage));
  const paginatedEmployees = useMemo(
    () => employeesWithTotals.slice((employeePage - 1) * employeesPerPage, employeePage * employeesPerPage),
    [employeePage, employeesWithTotals],
  );

  useEffect(() => {
    setEmployeePage((current) => Math.min(current, totalEmployeePages));
  }, [totalEmployeePages]);

  const selectedDetails = useMemo(() => employeesById.get(detailsId) ?? null, [detailsId, employeesById]);
  const detailItems = useMemo(() => {
    const detailItemsMap = new Map<number, { equipmentId: number; name: string; quantity: number }>();
    for (const item of selectedDetails?.items ?? []) {
      const current = detailItemsMap.get(item.equipmentId);
      if (current) {
        current.quantity += Number(item.quantity);
      } else {
        detailItemsMap.set(item.equipmentId, {
          equipmentId: item.equipmentId,
          name: item.name,
          quantity: Number(item.quantity),
        });
      }
    }
    return Array.from(detailItemsMap.values());
  }, [selectedDetails]);
  const selectedAssignment = useMemo(
    () => detailItems.find((item) => item.equipmentId === unassign.equipmentId) ?? null,
    [detailItems, unassign.equipmentId],
  );

  async function saveEmployee(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateFormWithFeedback(event.currentTarget, showNotice)) {
      return;
    }

    setError(null);
    try {
      if (selectedId) {
        await putJson(`/employees/${selectedId}`, form);
        showNotice("Colaborador atualizado com sucesso.");
      } else {
        await postJson("/employees", form);
        showNotice("Colaborador criado com sucesso.");
      }
      await loadEmployees();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Não foi possível salvar o colaborador.");
    }
  }

  async function removeEmployee() {
    if (!selectedId) {
      notifyError("Selecione um colaborador primeiro.");
      return;
    }

    try {
      await deleteJson(`/employees/${selectedId}`);
      setSelectedId(0);
      setDetailsId(0);
      showNotice("Colaborador excluído com sucesso.");
      await loadEmployees();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Não foi possível excluir o colaborador.");
    }
  }

  async function unassignItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateFormWithFeedback(event.currentTarget, showNotice)) {
      return;
    }

    if (!detailsId || !selectedAssignment) {
      notifyError("Selecione um item do colaborador primeiro.");
      return;
    }

    try {
      await postJson(`/employees/${detailsId}/unassign`, {
        equipmentId: unassign.equipmentId,
        quantity: unassign.quantity,
      });
      showNotice("Item desvinculado com sucesso.");
      await loadEmployees();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Não foi possível desvincular o item.");
    }
  }

  async function unassignAll() {
    if (!detailsId) {
      setError("Selecione um colaborador primeiro.");
      return;
    }

    try {
      await postJson(`/employees/${detailsId}/unassign-all`);
      showNotice("Todos os itens do colaborador foram desvinculados.");
      await loadEmployees();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Não foi possível desvincular todos os itens.");
    }
  }

  return (
    <ProtectedPage
      title="Colaboradores"
      description="Gerencie os colaboradores da empresa, filtre, crie, edite e visualize o histórico de alocações."
      notice={notice}
      actions={
        <button className="secondary-button" type="button" onClick={() => void downloadFile("/exports/employees", "employees.xlsx")}>
          Exportar Excel
        </button>
      }
    >
      {error ? <div className="message error">{error}</div> : null}

      <SectionCard title="Visão geral das pessoas" copy="Filtre colaboradores por escritório e inspecione rapidamente o volume de itens atribuídos.">
        <div className="toolbar employees-toolbar">
          <div className="toolbar-group">
            <div className="input-group">
              <label htmlFor="employee-search">Pesquisar</label>
              <input
                id="employee-search"
                placeholder="Nome ou escritório"
                value={filters.search}
                onChange={(event) => {
                  setEmployeePage(1);
                  setFilters((current) => ({ ...current, search: event.target.value }));
                }}
              />
            </div>
            <div className="input-group">
              <label htmlFor="employee-office-filter">Escritório</label>
              <select
                id="employee-office-filter"
                value={filters.office}
                onChange={(event) => {
                  setEmployeePage(1);
                  setFilters((current) => ({ ...current, office: event.target.value }));
                }}
              >
                <option value="Todos">Todos</option>
                {offices.map((office) => (
                  <option key={office} value={office}>
                    {office}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Escritório</th>
                <th>Itens atribuídos</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className="empty-state">Nenhum colaborador encontrado.</div>
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.nome}</td>
                    <td>{item.escritorio}</td>
                    <td>{item.totalAssigned}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredEmployees.length > employeesPerPage ? (
          <div className="table-pagination" aria-label="Paginação de colaboradores">
            {Array.from({ length: totalEmployeePages }, (_, index) => index + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                className={`pagination-button${pageNumber === employeePage ? " active" : ""}`}
                type="button"
                onClick={() => setEmployeePage(pageNumber)}
                aria-current={pageNumber === employeePage ? "page" : undefined}
              >
                {pageNumber}
              </button>
            ))}
          </div>
        ) : null}
      </SectionCard>

      <div className="split-grid">
        <SectionCard title="Criar ou editar colaborador" copy="Crie novos colaboradores ou edite existentes.">
          <div className="input-group">
            <label htmlFor="employee-picker">Registro atual*</label>
            <select id="employee-picker" value={selectedId} onChange={(event) => setSelectedId(Number(event.target.value))}>
              <option value={0}>Novo colaborador</option>
              {employees.map((item) => (
                <option key={item.id} value={item.id}>
                  #{item.id} - {item.nome}
                </option>
              ))}
            </select>
          </div>

          <form className="stack employee-form" onSubmit={saveEmployee} noValidate>
            <div className="input-group">
              <br>
              </br>
              <label htmlFor="employee-name">Nome completo*</label>
              <input id="employee-name" required value={form.nome} onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))} />
            </div>
            <div className="input-group">
              <label htmlFor="employee-office">Escritório*</label>
              <select id="employee-office" required value={form.escritorio} onChange={(event) => setForm((current) => ({ ...current, escritorio: event.target.value }))}>
                <option value="">Selecione um escritório</option>
                {offices.map((office) => (
                  <option key={office} value={office}>
                    {office}
                  </option>
                ))}
              </select>
            </div>

            <div className="inline-actions">
              <button className="primary-button" type="submit">
                {selectedId ? "Atualizar colaborador" : "Criar colaborador"}
              </button>
              <button className="danger-button" type="button" onClick={removeEmployee} disabled={!selectedId}>
                Excluir selecionado
              </button>
            </div>
          </form>
        </SectionCard>

        <SectionCard title="Detalhes da atribuição" copy="Inspecione um colaborador e processe devoluções parciais ou totais.">
          <div className="input-group">
            <label htmlFor="employee-details">Colaborador*</label>
            <select
              id="employee-details"
              value={detailsId}
              onChange={(event) => {
                const nextId = Number(event.target.value);
                setDetailsId(nextId);
                setUnassign({ equipmentId: 0, quantity: 1 });
              }}
            >
              <option value={0}>Selecione um colaborador</option>
              {filteredEmployees.map((item) => (
                <option key={item.id} value={item.id}>
                  #{item.id} - {item.nome} ({item.escritorio})
                </option>
              ))}
            </select>
          </div>
          <br>
          </br>
          {!selectedDetails ? (
            <div className="empty-state">Selecione um colaborador para inspecionar os itens atribuídos.</div>
          ) : (
            <div className="stack">
              <div className="table-shell">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Quantidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailItems.map((item) => (
                      <tr key={item.equipmentId}>
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {detailItems.length === 0 ? (
                <div className="empty-state">Este colaborador não possui itens atribuídos.</div>
              ) : (
                <>
                  <form className="stack" onSubmit={unassignItem} noValidate>
                    <div className="input-group">
                      <label htmlFor="employee-item">Item para desvincular</label>
                      <select
                        id="employee-item"
                        required
                        value={unassign.equipmentId === 0 ? "" : unassign.equipmentId}
                        onChange={(event) => setUnassign((current) => ({ ...current, equipmentId: Number(event.target.value), quantity: 1 }))}
                      >
                        <option value="">Selecione um item</option>
                        {detailItems.map((item) => (
                          <option key={item.equipmentId} value={item.equipmentId}>
                            {item.name} (qtd. {item.quantity})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="input-group">
                      <label htmlFor="employee-unassign-qty">Quantidade</label>
                      <input
                        id="employee-unassign-qty"
                        type="number"
                        required
                        min={1}
                        max={selectedAssignment?.quantity ?? 1}
                        value={unassign.quantity}
                        onChange={(event) => setUnassign((current) => ({ ...current, quantity: Number(event.target.value) }))}
                      />
                    </div>
                    <div className="inline-actions">
                      <button className="primary-button" type="submit">
                        Desvincular item
                      </button>
                      <button className="danger-button" type="button" onClick={unassignAll}>
                        Desvincular tudo
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          )}
        </SectionCard>
      </div>
    </ProtectedPage>
  );
}
