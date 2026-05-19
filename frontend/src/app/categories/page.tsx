"use client";

import { useEffect, useState } from "react";

import { ProtectedPage } from "@/components/protected-page";
import { SectionCard } from "@/components/section-card";
import { ApiError, deleteJson, getJson, postJson } from "@/lib/api";
import type { Category } from "@/lib/types";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [selectedId, setSelectedId] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadCategories() {
    const payload = await getJson<Category[]>("/categories");
    setCategories(payload);
  }

  useEffect(() => {
    void loadCategories().catch(() => setError("Não foi possível carregar as categorias."));
  }, []);

  async function createCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      await postJson("/categories", { name });
      setName("");
      setMessage("Categoria criada com sucesso.");
      await loadCategories();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Não foi possível criar a categoria.");
    }
  }

  async function removeCategory() {
    if (!selectedId) {
      setError("Selecione uma categoria primeiro.");
      return;
    }
    setError(null);
    try {
      await deleteJson(`/categories/${selectedId}`);
      setSelectedId(0);
      setMessage("Categoria excluída com sucesso.");
      await loadCategories();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Não foi possível excluir a categoria.");
    }
  }

  return (
    <ProtectedPage
      title="Categorias"
      description="Liste, crie e exclua categorias de equipamentos."
    >
      {error ? <div className="message error">{error}</div> : null}
      {message ? <div className="message success">{message}</div> : null}

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
          <form className="stack" onSubmit={createCategory}>
            <div className="input-group">
              <label htmlFor="category-name">Nova categoria</label>
              <input
                id="category-name"
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
              <label htmlFor="delete-category">Categoria para excluir</label>
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
