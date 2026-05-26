from __future__ import annotations

from datetime import date
from typing import Any

import pandas as pd
import streamlit as st

from python_app import services


st.set_page_config(
    page_title="Gerenciamento de Ativos - TI",
    layout="wide",
    initial_sidebar_state="expanded",
)


NOTEBOOK_CONDITIONS = ["Novo", "Bom", "Razoavel", "Com Defeito"]
NOTEBOOK_STATUSES = ["Em Estoque", "Em Uso", "Manutencao"]
STORAGE_TYPES = ["SSD", "HD", "NVMe", "SSD + HD"]
EMPLOYEE_OFFICE_OPTIONS = ["CampSoft", "Tocalivros"]
MENU_ITEMS = [
    {"page": "Dashboard", "label": "🖥️  Dashboard"},
    {"page": "Equipamentos", "label": "🧰  Equipamentos"},
    {"page": "Notebooks", "label": "💻  Notebooks"},
    {"page": "Categorias", "label": "🗂️  Categorias"},
    {"page": "Colaboradores", "label": "👥  Colaboradores"},
]


def inject_styles() -> None:
    st.markdown(
        """
        <style>
        .block-container {
            padding-top: 1.5rem;
            padding-bottom: 2rem;
        }
        .metric-card {
            background: linear-gradient(135deg, #ffffff, #eef2ff);
            border: 1px solid rgba(79, 70, 229, 0.12);
            border-radius: 16px;
            padding: 1rem 1rem 0.85rem;
            box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
            min-height: 130px;
            height: 130px;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        .metric-card-label {
            color: #6b7280;
            font-size: 0.86rem;
            font-weight: 600;
            margin-bottom: 0.45rem;
        }
        .metric-card-value {
            color: #111827;
            font-size: 1.9rem;
            font-weight: 800;
            letter-spacing: -0.04em;
        }
        .news-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-top: 1rem;
            max-width: 1200px;
        }
        @media (min-width: 768px) and (max-width: 1024px) {
            .news-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
        @media (min-width: 1025px) {
            .news-grid {
                grid-template-columns: repeat(3, 1fr);
            }
        }
        .news-card-wrapper {
            display: flex;
            flex-direction: column;
            border: 1px solid rgba(148, 163, 184, 0.24);
            border-radius: 12px;
            overflow: hidden;
            background: #ffffff;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
            height: 100%;
            transition: all 0.3s ease;
        }
        .news-card-img {
            width: 100%;
            height: 240px;
            object-fit: cover;
            flex-shrink: 0;
        }
        .news-card-content {
            display: flex;
            flex-direction: column;
            padding: 1.25rem;
            flex: 1;
        }
        .news-card-header {
            margin-bottom: 0.5rem;
        }
        .news-card-tag {
            display: inline-block;
            padding: 0.2rem 0.6rem;
            border-radius: 999px;
            background: rgba(79, 70, 229, 0.1);
            color: #4f46e5;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
        }
        .news-card-title {
            font-size: 1.1rem;
            font-weight: 700;
            color: #111827;
            margin: 0.5rem 0;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            line-height: 1.4;
        }
        .news-card-desc {
            color: #4b5563;
            font-size: 0.9rem;
            line-height: 1.5;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
            margin-bottom: 1rem;
            flex: 1;
        }
        .news-card-footer {
            display: flex;
            flex-direction: column;
            gap: 0.8rem;
            margin-top: auto;
        }
        .news-card-date {
            font-size: 0.8rem;
            color: #6b7280;
        }
        .news-card-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            padding: 0.5rem 1rem;
            background: transparent;
            color: #31333f;
            border: 1px solid rgba(49, 51, 63, 0.2);
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 400;
            text-decoration: none;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        .news-card-btn:hover {
            border-color: #4f46e5;
            color: #4f46e5;
        }
        .sidebar-brand {
            display: flex;
            justify-content: center;
            margin: 0.8rem 0 1.1rem;
        }
        .sidebar-brand a {
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 86px;
            height: 64px;
            border-radius: 18px;
            background: linear-gradient(135deg, rgba(34, 211, 238, 0.12), rgba(29, 78, 216, 0.18));
            border: 1px solid rgba(59, 130, 246, 0.16);
        }
        .sidebar-brand span {
            font-size: 2rem;
            font-weight: 900;
            letter-spacing: -0.14em;
            background: linear-gradient(135deg, #22d3ee, #1d4ed8);
            -webkit-background-clip: text;
            color: transparent;
            font-family: Arial, sans-serif;
        }
        [data-testid="stSidebar"] h1 {
            text-align: center;
            width: 100%;
        }
        .sidebar-menu-title {
            color: #6b7280;
            font-size: 0.82rem;
            font-weight: 700;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            margin: 0.35rem 0 0.55rem;
            text-align: left;
            width: 100%;
        }
        [data-testid="stSidebar"] .stButton > button {
            width: 100%;
            display: flex;
            justify-content: flex-start;
            align-items: center;
            text-align: left;
            border-radius: 12px;
            padding: 0.72rem 0.85rem;
            border: 1px solid transparent;
            background: transparent;
            color: #6b7280;
            font-weight: 600;
            box-shadow: none;
            font-size: 1rem;
            line-height: 1.2;
        }
        [data-testid="stSidebar"] .stButton > button > div,
        [data-testid="stSidebar"] .stButton > button > div > div {
            width: 100%;
            display: flex;
            justify-content: flex-start;
            align-items: center;
            text-align: left;
        }
        [data-testid="stSidebar"] .stButton > button:hover {
            background: rgba(79, 70, 229, 0.08);
            color: #312e81;
            border-color: rgba(79, 70, 229, 0.16);
        }
        [data-testid="stSidebar"] .stButton > button[kind="primary"] {
            background: linear-gradient(135deg, #4f46e5, #4338ca);
            color: white;
            border-color: rgba(79, 70, 229, 0.3);
            box-shadow: 0 10px 18px rgba(79, 70, 229, 0.18);
        }
        [data-testid="stSidebar"] .stButton > button[kind="primary"]:hover {
            background: linear-gradient(135deg, #4338ca, #3730a3);
            color: white;
        }
        [data-testid="stSidebar"] .stButton > button p {
            text-align: left;
            width: 100%;
            margin: 0;
            justify-content: flex-start;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )


def inject_theme_toggle_script() -> None:
    st.html(
        """
        <script>
            const parentDoc = window.parent.document;
            
            function initTheme() {
                if (parentDoc.getElementById("custom-theme-toggle")) return;

                const style = parentDoc.createElement("style");
                style.innerHTML = `
                    .stApp, .stAppHeader, [data-testid="stSidebar"], .stMarkdown, p, h1, h2, h3, h4, span, label,
                    .metric-card, .news-card, .stButton>button, .stTextInput>div>div>input {
                        transition: background-color 0.4s ease, color 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease !important;
                    }

                    .theme-toggle-container {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        background: var(--toggle-bg, #e2e8f0);
                        border-radius: 30px;
                        padding: 4px;
                        width: 56px;
                        height: 28px;
                        position: relative;
                        transition: all 0.3s ease;
                        box-shadow: inset 0 2px 4px rgba(0,0,0,0.06);
                    }
                    .theme-toggle-container:hover {
                        transform: scale(1.05);
                        background: #cbd5e1;
                    }
                    .theme-toggle-circle {
                        position: absolute;
                        left: 4px;
                        width: 20px;
                        height: 20px;
                        background: #ffffff;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                        box-shadow: 0 2px 4px rgba(0,0,0,0.15);
                    }
                    .theme-toggle-container.dark .theme-toggle-circle {
                        transform: translateX(28px);
                        background: #1e293b;
                    }
                    .theme-toggle-container.dark {
                        background: #475569;
                    }
                    .theme-toggle-container.dark:hover {
                        background: #334155;
                    }
                    .theme-icon {
                        font-size: 11px;
                        line-height: 1;
                    }

                    body[data-custom-theme="dark"] .stApp {
                        background-color: #0f172a !important;
                    }
                    body[data-custom-theme="dark"] .stAppHeader {
                        background-color: rgba(15, 23, 42, 0.8) !important;
                    }
                    body[data-custom-theme="dark"] [data-testid="stSidebar"] {
                        background-color: #1e293b !important;
                    }
                    body[data-custom-theme="dark"] p,
                    body[data-custom-theme="dark"] h1,
                    body[data-custom-theme="dark"] h2,
                    body[data-custom-theme="dark"] h3,
                    body[data-custom-theme="dark"] span:not(.theme-icon),
                    body[data-custom-theme="dark"] label,
                    body[data-custom-theme="dark"] .stMarkdown,
                    body[data-custom-theme="dark"] li {
                        color: #f8fafc !important;
                    }
                    
                    body[data-custom-theme="dark"] .metric-card {
                        background: linear-gradient(135deg, #1e293b, #0f172a) !important;
                        border: 1px solid rgba(255, 255, 255, 0.08) !important;
                        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3) !important;
                    }
                    body[data-custom-theme="dark"] .metric-card-label {
                        color: #94a3b8 !important;
                    }
                    body[data-custom-theme="dark"] .metric-card-value {
                        color: #f8fafc !important;
                    }

                    body[data-custom-theme="dark"] .news-card-wrapper {
                        background: #1e293b !important;
                        border: 1px solid rgba(255, 255, 255, 0.08) !important;
                    }
                    body[data-custom-theme="dark"] .news-card-title {
                        color: #f8fafc !important;
                    }
                    body[data-custom-theme="dark"] .news-card-desc {
                        color: #cbd5e1 !important;
                    }
                    body[data-custom-theme="dark"] .news-card-tag {
                        background: rgba(129, 140, 248, 0.15) !important;
                        color: #818cf8 !important;
                    }
                    body[data-custom-theme="dark"] .news-card-date {
                        color: #94a3b8 !important;
                    }
                    body[data-custom-theme="dark"] .news-card-btn {
                        color: #fafafa !important;
                        border-color: rgba(250, 250, 250, 0.2) !important;
                    }
                    body[data-custom-theme="dark"] .news-card-btn:hover {
                        border-color: #818cf8 !important;
                        color: #818cf8 !important;
                    }

                    body[data-custom-theme="dark"] .stTextInput>div>div>input,
                    body[data-custom-theme="dark"] .stNumberInput>div>div>input,
                    body[data-custom-theme="dark"] [data-testid="stSelectbox"] > div > div {
                        background-color: #1e293b !important;
                        color: #f8fafc !important;
                        border-color: #334155 !important;
                    }
                    
                    body[data-custom-theme="dark"] [data-testid="stSelectbox"] > div > div * {
                        color: #f8fafc !important;
                    }

                    body[data-custom-theme="dark"] .stButton>button[kind="secondary"] {
                        background-color: #1e293b !important;
                        color: #f8fafc !important;
                        border-color: #334155 !important;
                    }
                    body[data-custom-theme="dark"] .stButton>button[kind="secondary"]:hover {
                        border-color: #818cf8 !important;
                        color: #818cf8 !important;
                    }
                    
                    body[data-custom-theme="dark"] [data-testid="stSidebar"] .stButton>button[kind="secondary"]:hover {
                        background: rgba(129, 140, 248, 0.1) !important;
                        color: #818cf8 !important;
                        border-color: transparent !important;
                    }

                    body[data-custom-theme="dark"] [data-testid="stDataFrame"] {
                        filter: invert(0.92) hue-rotate(180deg) !important;
                    }
                    
                    body[data-custom-theme="dark"] [data-testid="stForm"] {
                        border-color: #334155 !important;
                    }
                    
                    body[data-custom-theme="dark"] [data-testid="stForm"] * {
                        color: #f8fafc;
                    }
                `;
                parentDoc.head.appendChild(style);

                const targetContainer = parentDoc.querySelector('header[data-testid="stHeader"]');
                if (!targetContainer) return;

                const toggleWrapper = parentDoc.createElement("div");
                toggleWrapper.id = "custom-theme-toggle";
                toggleWrapper.style.position = 'absolute';
                toggleWrapper.style.right = '80px';
                toggleWrapper.style.top = '16px';
                toggleWrapper.style.zIndex = '999999';

                toggleWrapper.innerHTML = `
                    <div class="theme-toggle-container" id="theme-switch" title="Alternar tema">
                        <div class="theme-toggle-circle">
                            <span class="theme-icon" id="theme-icon">☀️</span>
                        </div>
                    </div>
                `;

                targetContainer.appendChild(toggleWrapper);

                const switchBtn = parentDoc.getElementById("theme-switch");
                const icon = parentDoc.getElementById("theme-icon");
                const body = parentDoc.body;

                const currentTheme = localStorage.getItem("app_theme") || "light";
                
                function setTheme(theme) {
                    if (theme === "dark") {
                        body.setAttribute("data-custom-theme", "dark");
                        switchBtn.classList.add("dark");
                        icon.innerText = "🌙";
                    } else {
                        body.removeAttribute("data-custom-theme");
                        switchBtn.classList.remove("dark");
                        icon.innerText = "☀️";
                    }
                    localStorage.setItem("app_theme", theme);
                }

                setTheme(currentTheme);

                switchBtn.addEventListener("click", () => {
                    const isDark = body.hasAttribute("data-custom-theme");
                    setTheme(isDark ? "light" : "dark");
                });
            }

            let attempts = 0;
            const interval = setInterval(() => {
                if (parentDoc.querySelector('header[data-testid="stHeader"]')) {
                    initTheme();
                    clearInterval(interval);
                }
                attempts++;
                if (attempts > 30) clearInterval(interval);
            }, 100);
        </script>
        """,
        unsafe_allow_javascript=True,
    )


def init_session() -> None:
    services.init_db()
    st.session_state.setdefault("auth_user", None)
    st.session_state.setdefault("current_page", "Dashboard")


def format_public_date(value: str) -> str:
    parsed = pd.to_datetime(value, errors="coerce")
    if pd.isna(parsed):
        return date.today().strftime("%d/%m/%Y")
    return parsed.strftime("%d/%m/%Y")


def filter_items(
    items: list[dict[str, Any]],
    search: str,
    status_key: str | None = None,
    status_value: str = "Todos",
) -> list[dict[str, Any]]:
    filtered = items
    search = search.strip().lower()

    if status_key and status_value != "Todos":
        filtered = [item for item in filtered if str(item.get(status_key, "")) == status_value]

    if search:
        filtered = [
            item
            for item in filtered
            if search in " ".join(str(value).lower() for value in item.values())
        ]

    return filtered


def build_dataframe(items: list[dict[str, Any]], rename_map: dict[str, str], columns: list[str]) -> pd.DataFrame:
    if not items:
        return pd.DataFrame(columns=[rename_map[column] for column in columns])
    dataframe = pd.DataFrame(items)
    dataframe = dataframe[columns].rename(columns=rename_map)
    return dataframe


def inject_login_styles() -> None:
    st.markdown(
        """
        <style>
        .stApp {
            background:
                radial-gradient(circle at 12% 18%, rgba(191, 219, 254, 0.52), transparent 26%),
                radial-gradient(circle at 88% 8%, rgba(96, 165, 250, 0.18), transparent 24%),
                linear-gradient(180deg, #fbfdff 0%, #f3f7ff 100%);
        }
        .block-container {
            max-width: 1440px;
            padding-top: 1rem;
            padding-bottom: 1.5rem;
        }
        .campsoft-login-page {
            margin-bottom: 1.25rem;
        }
        .campsoft-browser-bar {
            display: flex;
            align-items: center;
            gap: 1rem;
            min-height: 72px;
            padding: 0.9rem 1.25rem;
            border-radius: 24px;
            border: 1px solid rgba(203, 213, 225, 0.72);
            background: rgba(255, 255, 255, 0.9);
            box-shadow: 0 24px 65px rgba(15, 23, 42, 0.08);
            backdrop-filter: blur(18px);
        }
        .campsoft-browser-dots {
            display: inline-flex;
            align-items: center;
            gap: 0.45rem;
        }
        .campsoft-browser-dots span {
            width: 12px;
            height: 12px;
            border-radius: 999px;
            display: block;
        }
        .campsoft-browser-dots span:nth-child(1) {
            background: #f87171;
        }
        .campsoft-browser-dots span:nth-child(2) {
            background: #fbbf24;
        }
        .campsoft-browser-dots span:nth-child(3) {
            background: #34d399;
        }
        .campsoft-browser-address {
            flex: 1;
            min-width: 0;
            padding: 0.85rem 1rem;
            border-radius: 16px;
            background: linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%);
            border: 1px solid rgba(191, 219, 254, 0.95);
            color: #64748b;
            font-size: 0.92rem;
            font-weight: 600;
            text-align: center;
            letter-spacing: 0.02em;
        }
        .campsoft-left-column {
            padding: 1.1rem 0.4rem 0 0.2rem;
        }
        .campsoft-brand {
            display: inline-flex;
            align-items: center;
            gap: 0.9rem;
        }
        .campsoft-brand-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 3.15rem;
            height: 3.15rem;
            border-radius: 18px;
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
            border: 1px solid rgba(96, 165, 250, 0.22);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
        }
        .campsoft-brand-name {
            color: #0f172a;
            font-size: 1.34rem;
            font-weight: 800;
            letter-spacing: 0.18em;
        }
        .campsoft-login-intro {
            max-width: 430px;
            margin: 1.4rem 0 1.6rem;
        }
        .campsoft-login-tag {
            display: inline-flex;
            align-items: center;
            padding: 0.42rem 0.76rem;
            border-radius: 999px;
            background: rgba(37, 99, 235, 0.08);
            color: #2563eb;
            font-size: 0.77rem;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
        }
        .campsoft-login-title {
            margin: 1rem 0 0.75rem;
            color: #0f172a;
            font-size: clamp(2rem, 2.5vw, 3rem);
            font-weight: 800;
            line-height: 1.05;
            letter-spacing: -0.05em;
        }
        .campsoft-login-copy {
            color: #64748b;
            font-size: 1rem;
            line-height: 1.7;
            margin: 0;
        }
        div[data-testid="stForm"] {
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid rgba(203, 213, 225, 0.76);
            border-radius: 28px;
            padding: 1.35rem 1.35rem 1.15rem;
            box-shadow: 0 26px 60px rgba(15, 23, 42, 0.08);
            backdrop-filter: blur(16px);
        }
        div[data-testid="stForm"] form {
            gap: 0.9rem;
        }
        div[data-testid="stTextInput"] {
            margin-bottom: 0.25rem;
        }
        div[data-testid="stTextInput"] label {
            display: none;
        }
        div[data-testid="stTextInput"] [data-baseweb="input"] {
            position: relative;
        }
        div[data-testid="stTextInput"] input {
            height: 56px !important;
            border-radius: 18px !important;
            border: 1px solid #d7e3f4 !important;
            background: linear-gradient(180deg, #f9fbff 0%, #f4f8ff 100%) !important;
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.92) !important;
            color: #0f172a !important;
            font-size: 0.98rem !important;
            padding-left: 3rem !important;
        }
        div[data-testid="stTextInput"] input::placeholder {
            color: #94a3b8;
        }
        div[data-testid="stTextInput"] input:focus {
            border-color: #60a5fa !important;
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12) !important;
        }
        .campsoft-enhanced-field {
            position: relative;
        }
        .campsoft-field-icon {
            position: absolute;
            left: 18px;
            top: 50%;
            width: 20px;
            height: 20px;
            transform: translateY(-50%);
            color: #64748b;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
        }
        .campsoft-password-field input {
            padding-right: 3.2rem !important;
        }
        .campsoft-eye-toggle {
            position: absolute;
            right: 16px;
            top: 50%;
            width: 34px;
            height: 34px;
            transform: translateY(-50%);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: 0;
            border-radius: 999px;
            background: transparent;
            color: #64748b;
            cursor: pointer;
            transition: background 0.2s ease, color 0.2s ease;
        }
        .campsoft-eye-toggle:hover {
            background: rgba(59, 130, 246, 0.08);
            color: #2563eb;
        }
        div[data-testid="stCheckbox"] {
            margin-top: 0.15rem;
        }
        div[data-testid="stCheckbox"] label {
            align-items: flex-start !important;
            gap: 0.35rem !important;
        }
        div[data-testid="stCheckbox"] label p {
            display: none;
        }
        div[data-testid="stCheckbox"] input {
            accent-color: #2563eb;
        }
        .campsoft-remember-copy-block {
            padding-top: 0.08rem;
        }
        .campsoft-remember-label {
            color: #0f172a;
            font-size: 0.95rem;
            font-weight: 700;
            line-height: 1.2;
        }
        .campsoft-remember-copy {
            margin-top: 0.18rem;
            color: #64748b;
            font-size: 0.84rem;
            line-height: 1.45;
        }
        div[data-testid="stFormSubmitButton"] button {
            height: 54px;
            border: 0 !important;
            border-radius: 18px !important;
            background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%) !important;
            color: #ffffff !important;
            font-size: 1rem !important;
            font-weight: 700 !important;
            box-shadow: 0 18px 32px rgba(37, 99, 235, 0.24) !important;
            transition: transform 0.2s ease, box-shadow 0.2s ease !important;
        }
        div[data-testid="stFormSubmitButton"] button:hover {
            transform: translateY(-1px);
            box-shadow: 0 22px 38px rgba(37, 99, 235, 0.28) !important;
            background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%) !important;
        }
        div[data-testid="stFormSubmitButton"] button:focus {
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.16) !important;
        }
        .campsoft-login-divider {
            height: 1px;
            margin: 1.45rem 0 1rem;
            background: linear-gradient(
                90deg,
                rgba(226, 232, 240, 0) 0%,
                rgba(203, 213, 225, 0.95) 50%,
                rgba(226, 232, 240, 0) 100%
            );
        }
        .campsoft-signup {
            color: #64748b;
            font-size: 0.96rem;
            line-height: 1.5;
        }
        .campsoft-signup span {
            color: #2563eb;
            font-weight: 700;
        }
        .campsoft-copyright {
            margin-top: 2.5rem;
            color: #94a3b8;
            font-size: 0.82rem;
            letter-spacing: 0.02em;
        }
        .campsoft-hero-panel {
            position: relative;
            min-height: 700px;
            padding: 2.3rem;
            border-radius: 32px;
            overflow: hidden;
            border: 1px solid rgba(203, 213, 225, 0.72);
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.82) 0%, rgba(247, 250, 255, 0.95) 100%);
            box-shadow: 0 30px 75px rgba(15, 23, 42, 0.09);
        }
        .campsoft-hero-panel::before {
            content: "";
            position: absolute;
            inset: auto auto 10% -6%;
            width: 280px;
            height: 280px;
            border-radius: 999px;
            background: radial-gradient(circle, rgba(147, 197, 253, 0.38) 0%, rgba(255, 255, 255, 0) 72%);
        }
        .campsoft-hero-panel::after {
            content: "";
            position: absolute;
            inset: -8% -4% auto auto;
            width: 240px;
            height: 240px;
            border-radius: 999px;
            background: radial-gradient(circle, rgba(196, 181, 253, 0.26) 0%, rgba(255, 255, 255, 0) 72%);
        }
        .campsoft-hero-kicker {
            display: inline-flex;
            align-items: center;
            gap: 0.45rem;
            padding: 0.46rem 0.78rem;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid rgba(191, 219, 254, 0.9);
            color: #2563eb;
            font-size: 0.78rem;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
        }
        .campsoft-hero-title {
            margin: 1rem 0 1rem;
            max-width: 11ch;
            color: #0f172a;
            font-size: clamp(2.3rem, 3.4vw, 4.25rem);
            font-weight: 800;
            line-height: 1.02;
            letter-spacing: -0.06em;
        }
        .campsoft-hero-title span {
            color: #2563eb;
        }
        .campsoft-hero-copy {
            max-width: 38rem;
            margin: 0 0 1.5rem;
            color: #64748b;
            font-size: 1rem;
            line-height: 1.72;
        }
        .campsoft-hero-illustration {
            position: relative;
            z-index: 1;
        }
        .campsoft-hero-illustration svg {
            width: 100%;
            height: auto;
            display: block;
        }
        @media (max-width: 991px) {
            .campsoft-browser-bar {
                flex-wrap: wrap;
            }
            .campsoft-browser-address {
                width: 100%;
            }
            .campsoft-hero-panel {
                min-height: auto;
                padding: 1.6rem;
            }
            .campsoft-left-column {
                padding-right: 0;
            }
        }
        </style>
        """,
        unsafe_allow_html=True,
    )


def inject_login_script() -> None:
    st.html(
        """
        <script>
        (() => {
            const doc = window.parent.document;
            const storageKey = "campsoft_login_email";

            function setNativeValue(element, value) {
                if (!element) return;
                const prototype = Object.getPrototypeOf(element);
                const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
                if (descriptor && descriptor.set) {
                    descriptor.set.call(element, value);
                } else {
                    element.value = value;
                }
                element.dispatchEvent(new Event("input", { bubbles: true }));
                element.dispatchEvent(new Event("change", { bubbles: true }));
            }

            function iconMarkup(type) {
                if (type === "email") {
                    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z" stroke="currentColor" stroke-width="1.6"/><path d="m5.5 7 6.5 5 6.5-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                }
                return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 10V7.5A4 4 0 0 1 12 3.5a4 4 0 0 1 4 4V10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><rect x="5" y="10" width="14" height="10" rx="2.5" stroke="currentColor" stroke-width="1.6"/><path d="M12 14.25v1.9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
            }

            function eyeMarkup(hidden) {
                if (hidden) {
                    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="12" r="2.75" stroke="currentColor" stroke-width="1.6"/></svg>';
                }
                return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 3 21 21" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M10.58 5.17A10.76 10.76 0 0 1 12 5c6 0 9.5 7 9.5 7a17.16 17.16 0 0 1-3.08 3.79M6.41 6.4C4.03 8.03 2.5 12 2.5 12s3.5 7 9.5 7a9.9 9.9 0 0 0 3.48-.62" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.88 9.88A3 3 0 0 0 14.12 14.12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
            }

            function enhanceField(wrapper, type) {
                if (!wrapper) {
                    return;
                }

                const host =
                    wrapper.querySelector('div[data-baseweb="input"]') ||
                    wrapper.querySelector("input")?.parentElement ||
                    wrapper;

                if (!host || host.dataset.campsoftEnhanced === type) {
                    return;
                }

                host.dataset.campsoftEnhanced = type;
                host.classList.add("campsoft-enhanced-field", `campsoft-${type}-field`);

                const icon = doc.createElement("span");
                icon.className = "campsoft-field-icon";
                icon.innerHTML = iconMarkup(type);
                host.appendChild(icon);

                if (type === "password") {
                    const input = wrapper.querySelector("input");
                    if (!input) {
                        return;
                    }

                    const toggle = doc.createElement("button");
                    toggle.type = "button";
                    toggle.className = "campsoft-eye-toggle";
                    toggle.setAttribute("aria-label", "Toggle password visibility");
                    toggle.innerHTML = eyeMarkup(true);
                    toggle.addEventListener("click", () => {
                        const isHidden = input.type === "password";
                        input.type = isHidden ? "text" : "password";
                        toggle.innerHTML = eyeMarkup(!isHidden);
                    });
                    host.appendChild(toggle);
                }
            }

            function initLoginChrome() {
                if (!doc.querySelector(".campsoft-login-page")) {
                    return;
                }

                const fieldWrappers = Array.from(doc.querySelectorAll('div[data-testid="stTextInput"]')).slice(0, 2);
                if (fieldWrappers.length < 2) {
                    return;
                }

                enhanceField(fieldWrappers[0], "email");
                enhanceField(fieldWrappers[1], "password");

                const emailInput = fieldWrappers[0].querySelector("input");
                const rememberInput = doc.querySelector('div[data-testid="stCheckbox"] input[type="checkbox"]');
                const submitButton = doc.querySelector('div[data-testid="stFormSubmitButton"] button');
                const storedEmail = window.localStorage.getItem(storageKey) || "";

                if (emailInput && storedEmail && emailInput.value !== storedEmail) {
                    setNativeValue(emailInput, storedEmail);
                }

                if (rememberInput && storedEmail && !rememberInput.checked) {
                    rememberInput.click();
                }

                if (submitButton && !submitButton.dataset.campsoftRememberBound) {
                    submitButton.dataset.campsoftRememberBound = "1";
                    submitButton.addEventListener(
                        "click",
                        () => {
                            const currentEmail = emailInput ? emailInput.value.trim() : "";
                            if (rememberInput && rememberInput.checked && currentEmail) {
                                window.localStorage.setItem(storageKey, currentEmail);
                            } else {
                                window.localStorage.removeItem(storageKey);
                            }
                        },
                        true
                    );
                }
            }

            if (!window.parent.__campsoftLoginObserver) {
                window.parent.__campsoftLoginObserver = new MutationObserver(initLoginChrome);
                window.parent.__campsoftLoginObserver.observe(doc.body, { childList: true, subtree: true });
            }

            window.requestAnimationFrame(initLoginChrome);
            setTimeout(initLoginChrome, 200);
        })();
        </script>
        """,
        unsafe_allow_javascript=True,
    )


def authenticate_login(username: str, password: str) -> dict[str, Any] | None:
    normalized_username = username.strip()
    if not normalized_username:
        return None
    return services.verify_user(normalized_username, password)


def show_login() -> None:
    inject_login_styles()
    inject_login_script()

    st.markdown(
        """
        <div class="campsoft-login-page">
            <div class="campsoft-browser-bar">
                <div class="campsoft-browser-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <div class="campsoft-browser-address">campsoft.cloud / secure-access</div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    left_column, right_column = st.columns([0.94, 1.06])

    with left_column:
        st.markdown(
            """
            <div class="campsoft-left-column">
                <div class="campsoft-brand">
                    <div class="campsoft-brand-icon">
                        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                            <rect x="4" y="4" width="24" height="24" rx="8" fill="url(#brand-gradient)"/>
                            <path d="M11 18.5 16 11l5 7.5" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
                            <circle cx="16" cy="21.5" r="2.1" fill="#ffffff"/>
                            <defs>
                                <linearGradient id="brand-gradient" x1="6" y1="6" x2="26" y2="26" gradientUnits="userSpaceOnUse">
                                    <stop stop-color="#60A5FA"/>
                                    <stop offset="1" stop-color="#2563EB"/>
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <div class="campsoft-brand-name">CAMPSOFT</div>
                </div>
                <div class="campsoft-login-intro">
                    <div class="campsoft-login-tag">Enterprise Login</div>
                    <h1 class="campsoft-login-title">Welcome back</h1>
                    <p class="campsoft-login-copy">
                        Access your Campsoft workspace through a premium, secure document portal built for modern teams.
                    </p>
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )

        with st.form("login_form", clear_on_submit=False):
            identifier = st.text_input(
                "Username",
                key="login_identifier",
                placeholder="Enter your username",
                label_visibility="collapsed",
            )
            password = st.text_input(
                "Password",
                key="login_password",
                placeholder="Enter your password",
                type="password",
                label_visibility="collapsed",
            )
            remember_column, remember_text_column = st.columns([0.12, 0.88])
            with remember_column:
                st.checkbox("Remember me", key="login_remember", label_visibility="collapsed")
            with remember_text_column:
                st.markdown(
                    """
                    <div class="campsoft-remember-copy-block">
                        <div class="campsoft-remember-label">Remember me</div>
                        <div class="campsoft-remember-copy">Save my login details for next time.</div>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )
            submitted = st.form_submit_button("Sign In", width="stretch")

        if submitted:
            user = authenticate_login(identifier, password)
            if not user:
                st.error("Invalid email or password.")
            else:
                st.session_state["auth_user"] = user
                st.rerun()

        st.markdown(
            """
            <div class="campsoft-login-divider"></div>
            <div class="campsoft-signup">Don't have an account? <span>Sign up</span></div>
            <div class="campsoft-copyright">Copyright 2026 Campsoft Corporation</div>
            """,
            unsafe_allow_html=True,
        )

    with right_column:
        st.markdown(
            """
            <div class="campsoft-hero-panel">
                <div class="campsoft-hero-kicker">Secure Workspace</div>
                <h2 class="campsoft-hero-title">
                    Securely Upload And Store Your Important Documents With <span>CAMPSOFT!</span>
                </h2>
                <p class="campsoft-hero-copy">
                    Streamlined protection for contracts, IDs, reports, and sensitive files with a clean enterprise experience.
                </p>
                <div class="campsoft-hero-illustration">
                    <svg viewBox="0 0 760 560" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <defs>
                            <linearGradient id="panelGlow" x1="130" y1="70" x2="640" y2="470" gradientUnits="userSpaceOnUse">
                                <stop stop-color="#EFF6FF"/>
                                <stop offset="1" stop-color="#DBEAFE"/>
                            </linearGradient>
                            <linearGradient id="cardGradient" x1="230" y1="240" x2="590" y2="470" gradientUnits="userSpaceOnUse">
                                <stop stop-color="#FFFFFF"/>
                                <stop offset="1" stop-color="#EEF4FF"/>
                            </linearGradient>
                            <linearGradient id="shirtGradient" x1="330" y1="240" x2="520" y2="450" gradientUnits="userSpaceOnUse">
                                <stop stop-color="#60A5FA"/>
                                <stop offset="1" stop-color="#2563EB"/>
                            </linearGradient>
                            <linearGradient id="phoneGradient" x1="482" y1="192" x2="574" y2="340" gradientUnits="userSpaceOnUse">
                                <stop stop-color="#C4B5FD"/>
                                <stop offset="1" stop-color="#60A5FA"/>
                            </linearGradient>
                        </defs>

                        <circle cx="632" cy="108" r="72" fill="#EEF2FF"/>
                        <circle cx="126" cy="404" r="56" fill="#E0F2FE"/>
                        <circle cx="168" cy="114" r="20" fill="#DBEAFE"/>
                        <circle cx="594" cy="458" r="28" fill="#E9D5FF"/>
                        <path d="M88 164C142 118 214 92 284 92" stroke="#BFDBFE" stroke-width="12" stroke-linecap="round"/>
                        <path d="M502 112C574 128 628 168 662 222" stroke="#C4B5FD" stroke-width="10" stroke-linecap="round"/>
                        <path d="M122 478C186 514 268 524 334 506" stroke="#D6E4FF" stroke-width="12" stroke-linecap="round"/>

                        <rect x="160" y="126" width="446" height="298" rx="44" fill="url(#panelGlow)"/>
                        <rect x="184" y="150" width="398" height="250" rx="36" fill="#FFFFFF" fill-opacity="0.72" stroke="#D7E3F4" stroke-width="2"/>

                        <rect x="462" y="168" width="98" height="176" rx="24" fill="url(#phoneGradient)"/>
                        <rect x="475" y="184" width="72" height="118" rx="16" fill="#FFFFFF" fill-opacity="0.92"/>
                        <rect x="495" y="312" width="30" height="8" rx="4" fill="#DBEAFE"/>
                        <circle cx="511" cy="200" r="4" fill="#DBEAFE"/>
                        <rect x="488" y="220" width="46" height="10" rx="5" fill="#DBEAFE"/>
                        <rect x="488" y="240" width="34" height="10" rx="5" fill="#BFDBFE"/>
                        <rect x="488" y="260" width="40" height="10" rx="5" fill="#C4B5FD"/>

                        <rect x="194" y="196" width="144" height="94" rx="24" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
                        <rect x="214" y="220" width="56" height="12" rx="6" fill="#60A5FA" fill-opacity="0.2"/>
                        <rect x="214" y="244" width="92" height="10" rx="5" fill="#E2E8F0"/>
                        <rect x="214" y="264" width="72" height="10" rx="5" fill="#E2E8F0"/>
                        <circle cx="306" cy="230" r="16" fill="#DBEAFE"/>
                        <path d="M300 230l5 5 10-12" stroke="#2563EB" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>

                        <rect x="206" y="320" width="118" height="70" rx="22" fill="#F8FAFF" stroke="#E2E8F0" stroke-width="2"/>
                        <circle cx="240" cy="355" r="16" fill="#E9D5FF"/>
                        <rect x="266" y="342" width="38" height="10" rx="5" fill="#C7D2FE"/>
                        <rect x="266" y="360" width="24" height="10" rx="5" fill="#DBEAFE"/>

                        <ellipse cx="394" cy="478" rx="142" ry="26" fill="#D7EAFE" fill-opacity="0.45"/>
                        <path d="M358 240c0-24 19-43 43-43h18c24 0 43 19 43 43v26h-104v-26Z" fill="#0F172A"/>
                        <circle cx="410" cy="206" r="40" fill="#F8C7B9"/>
                        <path d="M373 198c6-24 22-40 49-40 19 0 34 8 44 24-9 2-14 8-17 15-16-1-34 2-55 13-8-2-15-6-21-12Z" fill="#0F172A"/>
                        <path d="M381 255c10 8 22 12 34 12 12 0 24-4 34-12v32h-68v-32Z" fill="#F5B09C"/>
                        <path d="M328 444c6-76 24-130 53-162h60c33 27 53 78 58 152-42 18-137 20-171 10Z" fill="url(#shirtGradient)"/>
                        <path d="M387 286h56l24 26-24 28h-56l-23-28 23-26Z" fill="#93C5FD"/>
                        <path d="M390 339h53c22 0 40 18 40 40v66h-133v-66c0-22 18-40 40-40Z" fill="#1D4ED8" fill-opacity="0.14"/>

                        <path d="M334 328c-22 16-39 36-50 62-12 29-12 60 6 76l31-22c-6-8-6-22 0-40 7-18 19-35 33-49l-20-27Z" fill="#F8C7B9"/>
                        <path d="M472 324c18 16 33 36 42 61 10 27 8 57-9 73l-30-24c6-8 5-21-1-37-5-16-16-32-29-46l27-27Z" fill="#F8C7B9"/>
                        <path d="M332 326c13-18 33-34 52-40l7 54-55 17c-8-10-9-20-4-31Z" fill="#2563EB"/>
                        <path d="M465 320c-11-17-28-31-47-37l-12 53 56 20c8-11 9-23 3-36Z" fill="#3B82F6"/>

                        <circle cx="411" cy="207" r="3.8" fill="#0F172A"/>
                        <circle cx="434" cy="207" r="3.8" fill="#0F172A"/>
                        <path d="M411 226c8 5 16 5 24 0" stroke="#D9776A" stroke-width="3" stroke-linecap="round"/>
                    </svg>
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )


@st.cache_data(ttl=900, show_spinner=False)
def load_news() -> list[dict[str, Any]]:
    return services.fetch_ai_news(limit=3)


def render_sidebar() -> str:
    with st.sidebar:
        st.title("Dashboard - TI")
        st.markdown(
            '<div class="sidebar-brand"><a href="https://big-big.streamlit.app/" target="_blank"><span>BB</span></a></div>',
            unsafe_allow_html=True,
        )
        st.markdown('<div class="sidebar-menu-title">Menu</div>', unsafe_allow_html=True)
        for item in MENU_ITEMS:
            is_active = st.session_state["current_page"] == item["page"]
            if st.button(
                item["label"],
                key=f"menu_{item['page']}",
                width='stretch',
                type="primary" if is_active else "secondary",
            ):
                st.session_state["current_page"] = item["page"]
                st.rerun()

        st.divider()
        if st.button("Sair", width='stretch'):
            st.session_state["auth_user"] = None
            st.rerun()
    return st.session_state["current_page"]


def render_dashboard() -> None:
    st.title("Dashboard")
    stats = services.get_dashboard_stats()
    metric_specs = [
        ("Equipamentos (Tipos)", stats["totalItems"]),
        ("Em Estoque (Tipos)", stats["inStock"]),
        ("Em Falta", stats["outOfStock"]),
        ("Colaboradores", stats["totalEmployees"]),
        ("Notebooks", stats["totalNotebooks"]),
        ("Itens Alocados", stats["assignedItems"]),
    ]

    columns = st.columns(6)
    for column, (label, value) in zip(columns, metric_specs):
        with column:
            st.markdown(
                f"""
                <div class="metric-card">
                    <div class="metric-card-label">{label}</div>
                    <div class="metric-card-value">{value}</div>
                </div>
                """,
                unsafe_allow_html=True,
            )

    st.subheader("Informativos & Novidades")
    
    news_html = '<div class="news-grid">\n'
    for item in load_news():
        pub_date = format_public_date(item["pubDate"])
        news_html += f"""<div class="news-card-wrapper">
<img class="news-card-img" src="{item["image"]}" alt="Imagem da noticia">
<div class="news-card-content">
<div class="news-card-header">
<span class="news-card-tag">{item["category"]}</span>
</div>
<h3 class="news-card-title">{item["title"]}</h3>
<div class="news-card-desc">{item["description"]}</div>
<div class="news-card-footer">
<span class="news-card-date">{pub_date}</span>
<a href="{item["link"]}" target="_blank" class="news-card-btn">Ler mais</a>
</div>
</div>
</div>
"""
    news_html += '</div>'
    
    st.markdown(news_html, unsafe_allow_html=True)


def render_equipments() -> None:
    st.title("Equipamentos")
    equipments = services.list_equipments()

    search_column, status_column = st.columns([2, 1])
    with search_column:
        search = st.text_input("Buscar por nome, categoria ou numero de serie", key="equipment_search")
    with status_column:
        status_filter = st.selectbox("Status", ["Todos", "Em estoque", "Em falta"], key="equipment_status")

    filtered = filter_items(equipments, search, "status", status_filter)
    equipment_table = build_dataframe(
        filtered,
        {
            "id": "ID",
            "name": "Nome",
            "category": "Categoria",
            "totalQuantity": "Qtd. Total",
            "availableQuantity": "Qtd. Disponivel",
            "status": "Status",
            "location": "Localizacao",
        },
        ["id", "name", "category", "totalQuantity", "availableQuantity", "status", "location"],
    )
    st.dataframe(equipment_table, width='stretch', hide_index=True)

    manage_tab, assign_tab, history_tab, export_tab = st.tabs(
        ["Cadastrar / Editar", "Atribuir", "Historico", "Exportar"]
    )

    with manage_tab:
        categories = [item["name"] for item in services.list_categories()]
        selected_equipment = st.selectbox(
            "Selecionar equipamento para editar",
            [None] + equipments,
            format_func=lambda item: "Novo equipamento" if item is None else f"#{item['id']} - {item['name']}",
            key="equipment_editor_select",
        )
        current = selected_equipment or {
            "name": "",
            "category": categories[0] if categories else "Outros",
            "brand": "",
            "model": "",
            "serialNumber": "",
            "totalQuantity": 0,
            "availableQuantity": 0,
            "location": "",
            "entryDate": date.today().isoformat(),
        }

        with st.form("equipment_form"):
            name = st.text_input("Nome do produto", value=current["name"])
            left, right = st.columns(2)
            with left:
                category = st.selectbox(
                    "Categoria",
                    categories or ["Outros"],
                    index=(categories.index(current["category"]) if current["category"] in categories else 0),
                )
                brand = st.text_input("Marca", value=current["brand"] or "")
                total_quantity = st.number_input("Quantidade total", min_value=0, value=int(current["totalQuantity"]))
            with right:
                entry_date = st.date_input("Data de entrada", value=services.parse_iso_date(current["entryDate"]))
                model = st.text_input("Modelo", value=current["model"] or "")
                available_quantity = st.number_input(
                    "Quantidade disponivel",
                    min_value=0,
                    value=int(current["availableQuantity"]),
                )
            serial_number = st.text_input("Numero de serie", value=current["serialNumber"] or "")
            location = st.text_input("Localizacao", value=current["location"] or "")
            submitted = st.form_submit_button("Salvar equipamento")

        if submitted:
            try:
                payload = {
                    "id": current.get("id"),
                    "name": name,
                    "category": category,
                    "brand": brand,
                    "model": model,
                    "serialNumber": serial_number,
                    "totalQuantity": int(total_quantity),
                    "availableQuantity": int(available_quantity),
                    "location": location,
                    "entryDate": entry_date.isoformat(),
                }
                services.upsert_equipment(payload)
                st.success("Equipamento salvo com sucesso.")
                st.rerun()
            except ValueError as error:
                st.error(str(error))

        if selected_equipment and st.button("Excluir equipamento selecionado", key="equipment_delete"):
            try:
                services.delete_equipment(selected_equipment["id"])
                st.success("Equipamento excluido com sucesso.")
                st.rerun()
            except ValueError as error:
                st.error(str(error))

    with assign_tab:
        employees = services.list_employees()
        offices = services.list_offices()
        if not equipments or not employees:
            st.info("Cadastre equipamentos e colaboradores antes de fazer atribuicoes.")
        else:
            office = st.selectbox("Escritorio", offices, key="assign_office")
            employees_for_office = [employee for employee in employees if employee["escritorio"] == office]
            with st.form("assignment_form"):
                equipment = st.selectbox(
                    "Equipamento",
                    equipments,
                    format_func=lambda item: f"#{item['id']} - {item['name']} | {item['category']} | disponivel: {item['availableQuantity']}",
                )
                quantity = st.number_input("Quantidade", min_value=1, value=1)
                employee = st.selectbox(
                    "Funcionario",
                    employees_for_office,
                    format_func=lambda item: item["nome"],
                )
                assign_submitted = st.form_submit_button("Confirmar atribuicao")

            st.write(
                f"Disponivel: `{equipment['availableQuantity']}` | Localizacao: `{equipment['location']}`"
            )
            if assign_submitted:
                try:
                    services.assign_equipment(
                        equipment_id=equipment["id"],
                        employee_id=employee["id"],
                        quantity=int(quantity),
                        office=office,
                    )
                    st.success("Atribuicao realizada com sucesso.")
                    st.rerun()
                except ValueError as error:
                    st.error(str(error))

    with history_tab:
        if not equipments:
            st.info("Nenhum equipamento cadastrado.")
        else:
            history_equipment = st.selectbox(
                "Equipamento para historico",
                equipments,
                format_func=lambda item: f"#{item['id']} - {item['name']}",
                key="history_equipment_select",
            )
            history = services.get_equipment_history(history_equipment["id"])
            if history:
                history_table = build_dataframe(
                    history,
                    {
                        "equipmentName": "Equipamento",
                        "employeeName": "Funcionario",
                        "office": "Escritorio",
                        "quantity": "Quantidade",
                        "movementType": "Movimento",
                        "createdAt": "Criado em",
                    },
                    ["equipmentName", "employeeName", "office", "quantity", "movementType", "createdAt"],
                )
                st.dataframe(history_table, width='stretch', hide_index=True)
            else:
                st.info("Nenhum historico encontrado para este equipamento.")

    with export_tab:
        st.download_button(
            "Baixar inventario em Excel",
            data=services.export_equipments_report(),
            file_name="inventario_ti_python.xlsx",
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            width='stretch',
        )


def render_notebooks() -> None:
    st.title("Notebooks")
    notebooks = services.list_notebooks()
    notebook_status_options = sorted(
        {
            status
            for status in NOTEBOOK_STATUSES
            + [str(notebook.get("status", "")).strip() for notebook in notebooks]
            if status
        }
    )

    search_column, status_column = st.columns([2, 1])
    with search_column:
        search = st.text_input("Buscar por marca, modelo ou numero de serie", key="notebook_search")
    with status_column:
        status_filter = st.selectbox("Status", ["Todos"] + notebook_status_options, key="notebook_status")

    filtered = filter_items(notebooks, search, "status", status_filter)
    notebook_table = build_dataframe(
        filtered,
        {
            "id": "ID",
            "brand": "Marca",
            "model": "Modelo",
            "serialNumber": "Numero de Serie",
            "processor": "Processador",
            "ramTotal": "RAM",
            "status": "Status",
        },
        ["id", "brand", "model", "serialNumber", "processor", "ramTotal", "status"],
    )
    st.dataframe(notebook_table, width='stretch', hide_index=True)

    manage_tab, export_tab = st.tabs(["Cadastrar / Editar", "Exportar"])

    with manage_tab:
        selected_notebook = st.selectbox(
            "Selecionar notebook para editar",
            [None] + notebooks,
            format_func=lambda item: "Novo notebook" if item is None else f"#{item['id']} - {item['brand']} {item['model']}",
            key="notebook_editor_select",
        )
        current = selected_notebook or {
            "brand": "",
            "model": "",
            "serialNumber": "",
            "processor": "",
            "gpu": "",
            "screenSize": "",
            "ramTotal": 8,
            "ramSticks": 1,
            "storageType": "SSD",
            "storageCapacity": "",
            "condition": "Novo",
            "location": "",
            "status": "Em Estoque",
            "entryDate": date.today().isoformat(),
        }
        condition_options = list(dict.fromkeys([current["condition"]] + NOTEBOOK_CONDITIONS))
        storage_options = list(dict.fromkeys([current["storageType"]] + STORAGE_TYPES))
        status_options = list(dict.fromkeys([current["status"]] + notebook_status_options))

        with st.form("notebook_form"):
            brand = st.text_input("Marca", value=current["brand"])
            model = st.text_input("Modelo", value=current["model"])
            serial_number = st.text_input("Numero de serie / Service Tag", value=current["serialNumber"] or "")
            processor = st.text_input("Processador", value=current["processor"] or "")
            left, right = st.columns(2)
            with left:
                gpu = st.text_input("Placa de video", value=current["gpu"] or "")
                ram_total = st.number_input("RAM total (GB)", min_value=0, value=int(current["ramTotal"]))
                storage_type = st.selectbox(
                    "Tipo de armazenamento",
                    storage_options,
                    index=storage_options.index(current["storageType"]) if current["storageType"] in storage_options else 0,
                )
                condition = st.selectbox(
                    "Condicao",
                    condition_options,
                    index=condition_options.index(current["condition"]) if current["condition"] in condition_options else 0,
                )
            with right:
                screen_size = st.text_input("Tela", value=current["screenSize"] or "")
                ram_sticks = st.number_input("Qtd. de pentes RAM", min_value=0, value=int(current["ramSticks"]))
                storage_capacity = st.text_input("Capacidade do armazenamento", value=current["storageCapacity"] or "")
                status = st.selectbox(
                    "Status",
                    status_options,
                    index=status_options.index(current["status"]) if current["status"] in status_options else 0,
                )
            location = st.text_input("Localizacao", value=current["location"] or "")
            entry_date = st.date_input("Data de entrada", value=services.parse_iso_date(current["entryDate"]))
            submitted = st.form_submit_button("Salvar notebook")

        if submitted:
            try:
                payload = {
                    "id": current.get("id"),
                    "brand": brand,
                    "model": model,
                    "serialNumber": serial_number,
                    "processor": processor,
                    "gpu": gpu,
                    "screenSize": screen_size,
                    "ramTotal": int(ram_total),
                    "ramSticks": int(ram_sticks),
                    "storageType": storage_type,
                    "storageCapacity": storage_capacity,
                    "condition": condition,
                    "location": location,
                    "status": status,
                    "entryDate": entry_date.isoformat(),
                }
                services.upsert_notebook(payload)
                st.success("Notebook salvo com sucesso.")
                st.rerun()
            except ValueError as error:
                st.error(str(error))

        if selected_notebook and st.button("Excluir notebook selecionado", key="notebook_delete"):
            try:
                services.delete_notebook(selected_notebook["id"])
                st.success("Notebook excluido com sucesso.")
                st.rerun()
            except ValueError as error:
                st.error(str(error))

    with export_tab:
        st.download_button(
            "Baixar relatorio de notebooks",
            data=services.export_notebooks_report(),
            file_name="inventario_notebooks_python.xlsx",
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            width='stretch',
        )


def render_categories() -> None:
    st.title("Categorias")
    categories = services.list_categories()
    category_table = build_dataframe(
        categories,
        {"id": "ID", "name": "Nome da Categoria"},
        ["id", "name"],
    )
    st.dataframe(category_table, width='stretch', hide_index=True)

    add_column, delete_column = st.columns(2)
    with add_column:
        with st.form("category_form"):
            category_name = st.text_input("Nova categoria")
            add_submitted = st.form_submit_button("Adicionar categoria")
        if add_submitted:
            try:
                services.create_category(category_name)
                st.success("Categoria criada com sucesso.")
                st.rerun()
            except ValueError as error:
                st.error(str(error))

    with delete_column:
        if categories:
            selected_category = st.selectbox(
                "Categoria para excluir",
                categories,
                format_func=lambda item: f"#{item['id']} - {item['name']}",
            )
            if st.button("Excluir categoria selecionada"):
                try:
                    services.delete_category(selected_category["id"])
                    st.success("Categoria excluida com sucesso.")
                    st.rerun()
                except ValueError as error:
                    st.error(str(error))


def render_employees() -> None:
    st.title("Colaboradores")
    employees = services.list_employees_with_assignments()
    offices = sorted({employee["escritorio"] for employee in employees} | set(EMPLOYEE_OFFICE_OPTIONS))

    search_column, office_column = st.columns([2, 1])
    with search_column:
        search = st.text_input("Buscar por nome ou escritorio", key="employee_search")
    with office_column:
        office_filter = st.selectbox("Escritorio", ["Todos"] + offices, key="employee_office")

    filtered = employees
    if office_filter != "Todos":
        filtered = [employee for employee in filtered if employee["escritorio"] == office_filter]
    if search.strip():
        lower_search = search.strip().lower()
        filtered = [
            employee
            for employee in filtered
            if lower_search in employee["nome"].lower() or lower_search in employee["escritorio"].lower()
        ]

    employee_rows = [
        {
            "id": employee["id"],
            "nome": employee["nome"],
            "escritorio": employee["escritorio"],
            "itensAtribuidos": sum(int(item["quantity"]) for item in employee["items"]),
        }
        for employee in filtered
    ]
    employee_table = build_dataframe(
        employee_rows,
        {"id": "ID", "nome": "Nome", "escritorio": "Escritorio", "itensAtribuidos": "Itens Atribuidos"},
        ["id", "nome", "escritorio", "itensAtribuidos"],
    )
    st.dataframe(employee_table, width='stretch', hide_index=True)

    manage_tab, details_tab, export_tab = st.tabs(["Cadastrar / Editar", "Detalhes e Devolucoes", "Exportar"])

    with manage_tab:
        base_employees = services.list_employees()
        selected_employee = st.selectbox(
            "Selecionar colaborador para editar",
            [None] + base_employees,
            format_func=lambda item: "Novo colaborador" if item is None else f"#{item['id']} - {item['nome']}",
            key="employee_editor_select",
        )
        current = selected_employee or {"nome": "", "escritorio": offices[0] if offices else EMPLOYEE_OFFICE_OPTIONS[0]}

        with st.form("employee_form"):
            nome = st.text_input("Nome completo", value=current["nome"])
            escritorio = st.selectbox(
                "Escritorio",
                offices,
                index=offices.index(current["escritorio"]) if current["escritorio"] in offices else 0,
            )
            submitted = st.form_submit_button("Salvar colaborador")

        if submitted:
            try:
                services.upsert_employee(
                    {"id": current.get("id"), "nome": nome, "escritorio": escritorio}
                )
                st.success("Colaborador salvo com sucesso.")
                st.rerun()
            except ValueError as error:
                st.error(str(error))

        if selected_employee and st.button("Excluir colaborador selecionado", key="employee_delete"):
            try:
                services.delete_employee(selected_employee["id"])
                st.success("Colaborador excluido com sucesso.")
                st.rerun()
            except ValueError as error:
                st.error(str(error))

    with details_tab:
        if not filtered:
            st.info("Nenhum colaborador disponivel com os filtros atuais.")
        else:
            selected_details = st.selectbox(
                "Selecionar colaborador",
                filtered,
                format_func=lambda item: f"#{item['id']} - {item['nome']} | {item['escritorio']}",
                key="employee_details_select",
            )
            st.write(f"Escritorio: `{selected_details['escritorio']}`")
            details_rows = [
                {
                    "name": item["name"],
                    "quantity": item["quantity"],
                    "equipmentId": item["equipmentId"],
                }
                for item in selected_details["items"]
            ]
            details_table = build_dataframe(
                details_rows,
                {"name": "Item", "quantity": "Quantidade", "equipmentId": "Equipamento ID"},
                ["name", "quantity", "equipmentId"],
            )
            st.dataframe(details_table, width='stretch', hide_index=True)

            if selected_details["items"]:
                item = st.selectbox(
                    "Item para desatribuir",
                    selected_details["items"],
                    format_func=lambda value: f"{value['name']} | quantidade atual: {value['quantity']}",
                    key="employee_item_unassign",
                )
                quantity = st.number_input(
                    "Quantidade para devolver",
                    min_value=1,
                    max_value=int(item["quantity"]),
                    value=1,
                    key="employee_item_unassign_quantity",
                )
                action_left, action_right = st.columns(2)
                with action_left:
                    if st.button("Desatribuir item", width='stretch'):
                        try:
                            services.unassign_item(
                                employee_id=selected_details["id"],
                                equipment_id=item["equipmentId"],
                                quantity=int(quantity),
                            )
                            st.success("Item desatribuido com sucesso.")
                            st.rerun()
                        except ValueError as error:
                            st.error(str(error))
                with action_right:
                    if st.button("Desatribuir tudo", width='stretch'):
                        services.unassign_all(selected_details["id"])
                        st.success("Todos os itens foram desatribuidos.")
                        st.rerun()
            else:
                st.info("Nenhum item atribuido a este colaborador.")

    with export_tab:
        st.download_button(
            "Baixar relatorio de colaboradores",
            data=services.export_employees_report(),
            file_name="colaboradores_python.xlsx",
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            width='stretch',
        )


def main() -> None:
    inject_styles()
    inject_theme_toggle_script()
    init_session()

    if not st.session_state["auth_user"]:
        show_login()
        return

    page = render_sidebar()
    if page == "Dashboard":
        render_dashboard()
    elif page == "Equipamentos":
        render_equipments()
    elif page == "Notebooks":
        render_notebooks()
    elif page == "Categorias":
        render_categories()
    elif page == "Colaboradores":
        render_employees()


if __name__ == "__main__":
    main()
