type StatusTone = "info" | "success" | "warning";

const EQUIPMENT_STATUS_MAP: Record<string, { label: string; tone: StatusTone }> = {
  "em estoque": { label: "Em estoque", tone: "success" },
  "in stock": { label: "Em estoque", tone: "success" },
  available: { label: "Em estoque", tone: "success" },
  "em falta": { label: "Em falta", tone: "warning" },
  "out of stock": { label: "Em falta", tone: "warning" },
  unavailable: { label: "Em falta", tone: "warning" },
};

const NOTEBOOK_STATUS_MAP: Record<string, { label: string; tone: StatusTone }> = {
  "em estoque": { label: "Em estoque", tone: "success" },
  "em estoque ": { label: "Em estoque", tone: "success" },
  "em uso": { label: "Em uso", tone: "warning" },
  manutencao: { label: "Manutenção", tone: "warning" },
  "manutenção": { label: "Manutenção", tone: "warning" },
  "in stock": { label: "Em estoque", tone: "success" },
  "in use": { label: "Em uso", tone: "warning" },
  maintenance: { label: "Manutenção", tone: "warning" },
};

const NOTEBOOK_CONDITION_MAP: Record<string, string> = {
  novo: "Novo",
  bom: "Bom",
  razoavel: "Razoável",
  "razoável": "Razoável",
  "com defeito": "Com defeito",
  defective: "Com defeito",
};

const MOVEMENT_TYPE_MAP: Record<string, string> = {
  entrada: "Entrada",
  "saida": "Saída",
  "saída": "Saída",
  atribuicao: "Atribuição",
  "atribuição": "Atribuição",
  devolucao: "Devolução",
  "devolução": "Devolução",
  return: "Devolução",
  assignment: "Atribuição",
};

const API_ERROR_MAP: Record<string, string> = {
  "Request failed.": "A requisição falhou.",
  "Invalid credentials.": "Credenciais inválidas.",
  "Not authenticated.": "Não autenticado.",
  "Session expired or invalid.": "Sessão expirada ou inválida.",
  "Unable to sign in right now.": "Não foi possível entrar agora.",
};

const VALIDATION_ERROR_MAP: Record<string, string> = {
  "Field required": "Campo obrigatório.",
  "Field required.": "Campo obrigatório.",
  "Input should be a valid string": "Informe um texto válido.",
  "Input should be a valid string.": "Informe um texto válido.",
  "Input should be a valid integer": "Informe um número inteiro válido.",
  "Input should be a valid integer.": "Informe um número inteiro válido.",
  "Input should be a valid boolean": "Informe um valor booleano válido.",
  "Input should be a valid boolean.": "Informe um valor booleano válido.",
  "Input should be a valid date": "Informe uma data válida.",
  "Input should be a valid date.": "Informe uma data válida.",
  "String should have at least 1 character": "O campo não pode ficar vazio.",
  "String should have at least 1 character.": "O campo não pode ficar vazio.",
  "Input should be greater than or equal to 1": "O valor deve ser maior ou igual a 1.",
  "Input should be greater than or equal to 0": "O valor deve ser maior ou igual a 0.",
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function lookup(map: Record<string, { label: string; tone: StatusTone }>, value: string) {
  const key = normalize(value);
  return map[key] ?? { label: value, tone: "info" };
}

export function translateApiMessage(message: string): string {
  const trimmed = message.trim();
  return API_ERROR_MAP[trimmed] ?? VALIDATION_ERROR_MAP[trimmed] ?? trimmed;
}

export function translateErrorField(path: string): string {
  return path.replace(/^(body|query|path|header)\./, "");
}

export function translateEquipmentStatus(value: string): string {
  return lookup(EQUIPMENT_STATUS_MAP, value).label;
}

export function equipmentStatusTone(value: string): StatusTone {
  return lookup(EQUIPMENT_STATUS_MAP, value).tone;
}

export function translateNotebookStatus(value: string): string {
  return lookup(NOTEBOOK_STATUS_MAP, value).label;
}

export function notebookStatusTone(value: string): StatusTone {
  return lookup(NOTEBOOK_STATUS_MAP, value).tone;
}

export function translateNotebookCondition(value: string): string {
  const key = normalize(value);
  return NOTEBOOK_CONDITION_MAP[key] ?? value;
}

export function translateMovementType(value: string): string {
  const key = normalize(value);
  return MOVEMENT_TYPE_MAP[key] ?? value;
}
