"use client";

import { useEffect, useState } from "react";

import { ProtectedPage } from "@/components/protected-page";
import { SectionCard } from "@/components/section-card";
import { useTimedNotice } from "@/components/form-toast";
import { ApiError, deleteJson, getJson, postJson } from "@/lib/api";
import { validateFormWithFeedback } from "@/lib/form-validation";
import type { Category } from "@/lib/types";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [selectedId, setSelectedId] = useState<number>(0);
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
          <div className="table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((item) => (
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
              <select id="delete-category" value={selectedId} onChange={(event) => setSelectedId(Number(event.target.value))}>
                <option value={0}>Selecione uma categoria</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    #{item.id} - {item.name}
                  </option>
                ))}
              </select>
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
