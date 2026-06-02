"use client";

import { useEffect, useMemo, useState } from "react";

import { ProtectedPage } from "@/components/protected-page";
import { SectionCard } from "@/components/section-card";
import { CustomSelect } from "@/components/custom-select";
import { useTimedNotice } from "@/components/form-toast";
import { ApiError, deleteJson, getJson, postJson } from "@/lib/api";
import { validateFormWithFeedback } from "@/lib/form-validation";
import type { Category } from "@/lib/types";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [selectedId, setSelectedId] = useState<number>(0);
  const [listOrder, setListOrder] = useState<"id" | "name">("id");
  const [error, setError] = useState<string | null>(null);
  const { notice, showNotice } = useTimedNotice();

  function notifyError(message: string) {
    setError(message);
  }

  async function loadCategories() {
    const payload = await getJson<Category[]>("/categories");
    setCategories(payload);
  }

  useEffect(() => {
    void loadCategories().catch(() => setError("Não foi possível carregar as categorias."));
  }, []);

  useEffect(() => {
    if (error) {
      showNotice(error, { tone: "error" });
    }
  }, [error, showNotice]);

  const orderedCategories = useMemo(() => {
    const nextCategories = [...categories];

    if (listOrder === "name") {
      return nextCategories.sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));
    }

    return nextCategories.sort((left, right) => left.id - right.id);
  }, [categories, listOrder]);

  async function createCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateFormWithFeedback(event.currentTarget, showNotice)) {
      return;
    }

    setError(null);
    try {
      await postJson("/categories", { name });
      setName("");
      showNotice("Categoria criada com sucesso.");
      await loadCategories();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Não foi possível criar a categoria.");
    }
  }

  async function removeCategory() {
    if (!selectedId) {
      notifyError("Selecione uma categoria primeiro.");
      return;
    }
    setError(null);
    try {
      await deleteJson(`/categories/${selectedId}`);
      setSelectedId(0);
      showNotice("Categoria excluída com sucesso.");
      await loadCategories();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Não foi possível excluir a categoria.");
    }
  }

  return (
    <ProtectedPage
      title="Categorias"
      description="Liste, crie e exclua categorias de equipamentos."
      notice={notice}
    >
      {error ? <div className="message error">{error}</div> : null}

      <div className="split-grid">
        <SectionCard title="Categorias atuais" copy="As categorias de inventário são servidas diretamente pela camada FastAPI.">
          <div className="input-group" style={{ marginBottom: "1rem" }}>
            <label htmlFor="category-list-order">Listar por</label>
            <CustomSelect
              id="category-list-order"
              value={listOrder}
              onValueChange={(value) => setListOrder(value as "id" | "name")}
              options={[
                { value: "id", label: "ID" },
                { value: "name", label: "Nome" },
              ]}
            />
          </div>

          <div className="table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                </tr>
              </thead>
              <tbody>
                {orderedCategories.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Criar ou excluir" copy="Mantenha as alterações em categorias pequenas e explícitas.">
          <form className="stack" onSubmit={createCategory} noValidate>
            <div className="input-group">
              <label htmlFor="category-name">Nova categoria*</label>
              <input
                id="category-name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Adicione uma nova categoria"
              />
            </div>
            <button className="primary-button" type="submit">
              Criar categoria
            </button>
          </form>

          <div className="subtle-divider" />

          <div className="stack">
            <div className="input-group">
              <label htmlFor="delete-category">Categoria para excluir*</label>
              <CustomSelect
                id="delete-category"
                value={String(selectedId)}
                onValueChange={(value) => setSelectedId(Number(value))}
                options={[
                  { value: "0", label: "Selecione uma categoria" },
                  ...orderedCategories.map((item) => ({ value: String(item.id), label: `#${item.id} - ${item.name}` })),
                ]}
              />
            </div>
            <button className="danger-button" type="button" onClick={removeCategory}>
              Excluir selecionada
            </button>
          </div>
        </SectionCard>
      </div>
    </ProtectedPage>
  );
}
