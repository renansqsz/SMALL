"use client";

import { useEffect, useState } from "react";

import { ProtectedPage } from "@/components/protected-page";
import { SectionCard } from "@/components/section-card";
import { getJson } from "@/lib/api";
import type { DashboardStats } from "@/lib/types";

const shortcuts = [
  {
    title: "Operações com equipamentos",
    copy: "Crie, edite, atribua e audite itens de estoque sem reiniciar o aplicativo inteiro.",
  },
  {
    title: "Ciclo de vida dos portáteis",
    copy: "Gerencie especificações, controle de estado e exportações em uma página estável.",
  },
  {
    title: "Controle de atribuições dos colaboradores",
    copy: "Acompanhe quem está com cada item, filtre por escritório e processe devoluções por rotas dedicadas.",
  },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadStats() {
      try {
        const payload = await getJson<DashboardStats>("/dashboard/stats");
        if (mounted) {
          setStats(payload);
        }
      } catch {
        if (mounted) {
          setError("Não foi possível carregar as métricas do painel.");
        }
      }
    }

    void loadStats();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ProtectedPage
      title="Painel operacional"
      description="Gerencia, registre, monitore e controle os ativos de TI da empresa."
    >
      <div className="dashboard-stack">
        {error ? <div className="message error">{error}</div> : null}

        <SectionCard title="Resumo do inventário" copy="Abaixo está um resumo do inventário de TI da empresa.">
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">Tipos de equipamentos</div>
              <div className="metric-value">{stats?.totalItems ?? "-"}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Em estoque</div>
              <div className="metric-value">{stats?.inStock ?? "-"}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Fora de estoque</div>
              <div className="metric-value">{stats?.outOfStock ?? "-"}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Colaboradores</div>
              <div className="metric-value">{stats?.totalEmployees ?? "-"}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Portáteis</div>
              <div className="metric-value">{stats?.totalNotebooks ?? "-"}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Itens atribuídos</div>
              <div className="metric-value">{stats?.assignedItems ?? "-"}</div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Novas atualizações"
          copy="A nova stack abre mais espaço para evoluir sem brigar com o runtime da interface."
          className="dashboard-updates-card"
        >
          <div className="card-grid">
            {shortcuts.map((item) => (
              <article key={item.title} className="shortcut-card">
                <h3 className="shortcut-title">{item.title}</h3>
                <p className="shortcut-copy">{item.copy}</p>
              </article>
            ))}
          </div>
        </SectionCard>
      </div>
    </ProtectedPage>
  );
}
