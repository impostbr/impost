/**
 * ═══════════════════════════════════════════════════════════
 * IMPOST. — Dashboard Controller
 * Calculadora Tributária Inteligente — Estado do Pará 2026
 * ═══════════════════════════════════════════════════════════
 * 
 * Este arquivo controla apenas a navegação do dashboard:
 *   - Troca de abas (tabs)
 *   - Sidebar collapse/expand
 *   - Menu mobile
 * 
 * Cada aba terá seu próprio JS separado:
 *   - analise.js       → Formulário + cálculo dos 3 regimes
 *   - simulacao.js     → Projeção 12 meses e cenários
 *   - cnaes.js         → Tabela de CNAEs com busca/filtro
 *   - municipios.js    → Tabela de municípios e ISS
 *   - relatorio.js     → Geração de PDF
 *   - legislacao.js    → Referência de tabelas/alíquotas
 */

(function () {
    "use strict";

    // ═══════════════════════════════════════════
    //  DOM REFERENCES
    // ═══════════════════════════════════════════
    const sidebar = document.getElementById("sidebar");
    const sidebarToggle = document.getElementById("sidebarToggle");
    const sidebarOverlay = document.getElementById("sidebarOverlay");
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const topbarIcon = document.getElementById("topbarIcon");
    const topbarTitle = document.getElementById("topbarTitle");
    const navButtons = document.querySelectorAll(".nav-btn[data-tab]");
    const tabPanels = document.querySelectorAll(".tab-panel");

    // ═══════════════════════════════════════════
    //  TAB DATA
    // ═══════════════════════════════════════════
    const TAB_META = {
        analise:    { icon: "📊", title: "Análise Inicial" },
        simulacao:  { icon: "⚡", title: "Simulação Detalhada" },
        cnaes:      { icon: "🏷️", title: "CNAEs" },
        municipios: { icon: "📍", title: "Municípios / ISS" },
        relatorio:  { icon: "📄", title: "Relatório PDF" },
        legislacao: { icon: "📚", title: "Legislação" },
    };

    // ═══════════════════════════════════════════
    //  STATE
    // ═══════════════════════════════════════════
    let activeTab = "analise";
    let sidebarCollapsed = false;

    // ═══════════════════════════════════════════
    //  TAB SWITCHING
    // ═══════════════════════════════════════════
    function switchTab(tabId) {
        if (!TAB_META[tabId]) return;
        activeTab = tabId;

        // Update nav buttons
        navButtons.forEach(btn => {
            btn.classList.toggle("active", btn.dataset.tab === tabId);
        });

        // Update panels
        tabPanels.forEach(panel => {
            const panelId = panel.id.replace("panel-", "");
            panel.classList.toggle("active", panelId === tabId);
        });

        // Update topbar
        const meta = TAB_META[tabId];
        topbarIcon.textContent = meta.icon;
        topbarTitle.textContent = meta.title;

        // Close mobile sidebar
        closeMobileSidebar();

        // Dispatch custom event for tab modules
        window.dispatchEvent(new CustomEvent("impost:tab-change", {
            detail: { tab: tabId }
        }));
    }

    // Bind nav buttons
    navButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            switchTab(btn.dataset.tab);
        });
    });

    // ═══════════════════════════════════════════
    //  SIDEBAR COLLAPSE
    // ═══════════════════════════════════════════
    function toggleSidebar() {
        sidebarCollapsed = !sidebarCollapsed;
        sidebar.classList.toggle("collapsed", sidebarCollapsed);

        // Save preference
        try {
            localStorage.setItem("impost_sidebar", sidebarCollapsed ? "1" : "0");
        } catch (e) { /* ignore */ }
    }

    // Restore preference
    function restoreSidebarState() {
        try {
            const saved = localStorage.getItem("impost_sidebar");
            if (saved === "1") {
                sidebarCollapsed = true;
                sidebar.classList.add("collapsed");
            }
        } catch (e) { /* ignore */ }
    }

    sidebarToggle.addEventListener("click", toggleSidebar);

    // ═══════════════════════════════════════════
    //  MOBILE MENU
    // ═══════════════════════════════════════════
    function openMobileSidebar() {
        sidebar.classList.remove("mobile-hidden");
        sidebarOverlay.classList.add("active");
    }

    function closeMobileSidebar() {
        sidebar.classList.add("mobile-hidden");
        sidebarOverlay.classList.remove("active");
    }

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener("click", openMobileSidebar);
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener("click", closeMobileSidebar);
    }

    // Set initial mobile state
    function checkMobile() {
        if (window.innerWidth <= 1024) {
            sidebar.classList.add("mobile-hidden");
        } else {
            sidebar.classList.remove("mobile-hidden");
        }
    }

    window.addEventListener("resize", checkMobile);

    // ═══════════════════════════════════════════
    //  KEYBOARD SHORTCUTS
    // ═══════════════════════════════════════════
    document.addEventListener("keydown", (e) => {
        // Alt + 1-6 para trocar abas
        if (e.altKey && !e.ctrlKey && !e.shiftKey) {
            const tabKeys = Object.keys(TAB_META);
            const num = parseInt(e.key);
            if (num >= 1 && num <= tabKeys.length) {
                e.preventDefault();
                switchTab(tabKeys[num - 1]);
            }
        }

        // Alt + B para toggle sidebar
        if (e.altKey && e.key === "b") {
            e.preventDefault();
            toggleSidebar();
        }
    });

    // ═══════════════════════════════════════════
    //  PUBLIC API
    // ═══════════════════════════════════════════
    /**
     * Expõe API global para os módulos das abas usarem.
     * Exemplo de uso em analise.js:
     *   IMPOST.switchTab("relatorio");
     *   IMPOST.getActiveTab(); // "analise"
     */
    window.IMPOST = {
        switchTab,
        getActiveTab: () => activeTab,
        getPanel: (tabId) => document.getElementById(`panel-${tabId}`),
        VERSION: "2.0.0",
    };

    // ═══════════════════════════════════════════
    //  INIT
    // ═══════════════════════════════════════════
    restoreSidebarState();
    checkMobile();

    console.log(
        "%c IMPOST. v2.0 %c Calculadora Tributária — Pará 2026 ",
        "background:#10b981;color:#fff;font-weight:bold;padding:4px 8px;border-radius:4px 0 0 4px;",
        "background:#1e293b;color:#94a3b8;padding:4px 8px;border-radius:0 4px 4px 0;"
    );

})();
