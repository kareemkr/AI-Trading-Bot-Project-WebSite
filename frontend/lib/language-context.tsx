"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "es" | "fr" | "de" | "ar";

const translations = {
  en: {
    hero: {
      title_line1: "Trade Like",
      title_line2: "The Machine.",
      subtitle: "I built Neural Flow to destroy the gap between retail and institutions. Consolidating Live Chart Intelligence and Real-time News Sentiment into a single, automated protocol.",
      cta_primary: "Initialize Engine",
      cta_secondary: "Explore Intelligence",
      stat_lat: "Latency",
      stat_up: "Uptime",
      stat_sig: "Neural Signals"
    },
    header: {
        signin: "Sign In",
        get_started: "Get Started",
        dashboard: "Dashboard",
        logout: "Logout"
    },
    nav: {
        overview: "Overview",
        live_bot: "Live Bot",
        demo_bot: "Demo Bot",
        market: "Market",
        subscription: "Subscription",
        settings: "Settings",
        site_home: "Site Home",
        trade: "Trade",
        profile: "Profile",
        wallet: "Wallet",
        logs: "Logs"
    },
    sidebar: {
        command_center: "Command Center",
        elite_protocol: "Elite Protocol",
        elite_desc: "Activate fully automated trading bots and news sentiment AI.",
        unlock: "Unlock Everything",
        active_modules: "Active Modules",
        binance_proto: "Binance Protocol",
        ops_cloud: "Operations Cloud"
    },
    dashboard: {
        title: "Neural Command",
        elite_active: "Elite Intelligence Active • Live Feed",
        free_preview: "Security Protocol v4 • Preview Mode",
        quantum_synced: "Quantum Synced",
        wallet: "Wallet",
        equity_value: "Equity Value",
        account_tier: "Account Tier",
        pnl_24h: "24h PnL",
        success_rate: "Success Rate",
        performance_matrix: "Performance Matrix",
        market_intel: "Market Intelligence",
        open_bot: "Open Bot Engine",
        view_signals: "View Live Signals",
        live_control: "Live Bot Control",
        account_status: "Account Status",
        recent_ops: "Recent Operations",
        security_title: "Institutional Security",
        security_desc: "All executions are processed through our encrypted private node on Binance."
    },
    bots: {
        offline_msg: "AI Engine Offline",
        activate_link: "Activate Neural Link",
        terminate: "Terminate Engine",
        initialize: "Initialize Engine",
        leverage_proto: "Leverage_Protocol",
        link_status: "Neural_Link_Status",
        operational: "Operational",
        awaiting_input: "Awaiting_Input",
        simulation_active: "Simulation_Active",
        advanced_matrix: "Advanced_Matrix",
        strategy_engine: "Strategy_Engine",
        graph_conviction: "Graph_Conviction (TA)",
        news_sentiment: "News_Sentiment (AI)",
        global_session: "Global_Session",
        neural_synergy: "Neural_Synergy",
        high_conviction: "High_Conviction",
        analyzing: "Analyzing",
        inst_access: "Institutional Access Only",
        exclusive_msg: "The Live AI Trading Engine is exclusively available for Pro & Elite subscribers.",
        upgrade_plan: "Upgrade Plan"
    },
    demo: {
        title: "Demo Trading Bot",
        active_mode: "Simulation Active • Paper Trading Mode",
        paused_mode: "Simulation Paused • Ready to Start",
        start: "Start Demo",
        pause: "Pause",
        reset: "Reset",
        balance: "Balance",
        total_trades: "Total Trades",
        total_pnl: "Total PnL",
        win_rate: "Win Rate",
        execution_log: "Execution Log",
        recent_trades: "Recent Trades",
        asset: "Asset",
        side: "Side",
        entry: "Entry",
        pnl: "PNL",
        status: "Status",
        info_title: "Demo Mode - Paper Trading",
        info_desc: "This is a simulated trading environment using demo data. No real funds are at risk.",
        waiting: "Awaiting Simulation Start...",
        active_status: "Active",
        standby_status: "Standby"
    },
    market: {
        title: "Market Intelligence",
        subtitle: "Live Neural Stream • TradingView Engine",
        all: "All",
        gainers: "Gainers",
        losers: "Losers",
        favs: "Favs",
        search: "SEARCH PROTOCOLS...",
        live_feed: "Live Exchange Feed"
    },
    settings: {
        title: "Settings",
        subtitle: "Neural Flow • Operational Configuration",
        tabs: {
            identity: "Identity",
            neural_link: "Neural Link",
            comms: "Comms Link",
            engine: "Engine Logic",
            security: "Security"
        },
        alias: "Operational Alias",
        email: "Secure Channel (Email)",
        api_key: "Exchange API Key",
        secret_key: "Exchange Secret Key",
        tg_token: "Bot Authentication Token",
        tg_chat_id: "Target Chat ID",
        auto_trade: "Auto-Trade Protocol",
        risk_notifications: "Risk Shield Notifications",
        sync_data: "Synchronize Data",
        save_success: "Intelligence Stream Synced",
        browser_ext: "Antigravity Browser Extension",
        ext_status: "Extension Status"
    },
    subscription: {
        title: "Billing & Plans",
        subtitle: "Manage your subscription, billing history, and payment methods.",
        elite_active: "Elite Protocol Active",
        standard_account: "Standard Account",
        inst_tier: "Institutional Tier",
        elite_desc: "Neural Engine synchronization at 100%. Enjoy priority trade execution.",
        free_desc: "You are currently exploring our free features.",
        activate: "Activate Elite Protocol",
        view_billing: "Billing Matrix",
        view_comparison: "View Comparison",
        wallets: "Linked Neural Wallets",
        invoices: "Intelligence Invoices",
        protection: "Account Protection"
    }
  },
  es: {
    hero: {
      title_line1: "Opera Como",
      title_line2: "La Máquina.",
      subtitle: "Construí Neural Flow para destruir la brecha entre minoristas e instituciones. Consolidando Inteligencia de Gráficos y Sentimiento de Noticias en tiempo real.",
      cta_primary: "Iniciar Motor",
      cta_secondary: "Explorar Inteligencia",
      stat_lat: "Latencia",
      stat_up: "Tiempo Activo",
      stat_sig: "Señales Neuronales"
    },
    header: {
        signin: "Entrar",
        get_started: "Empezar",
        dashboard: "Panel",
        logout: "Salir"
    },
    nav: {
        overview: "Resumen",
        live_bot: "Bot en Vivo",
        demo_bot: "Bot Demo",
        market: "Mercado",
        subscription: "Suscripción",
        settings: "Ajustes",
        site_home: "Inicio",
        trade: "Operar",
        profile: "Perfil",
        wallet: "Billetera",
        logs: "Registros"
    },
    sidebar: {
        command_center: "Centro de Comando",
        elite_protocol: "Protocolo Élite",
        elite_desc: "Activa bots de trading automatizados e IA de noticias.",
        unlock: "Desbloquear Todo",
        active_modules: "Módulos Activos",
        binance_proto: "Protocolo Binance",
        ops_cloud: "Nube de Operaciones"
    },
    dashboard: {
        title: "Comando Neuronal",
        elite_active: "Inteligencia Élite Activa • En Vivo",
        free_preview: "Protocolo de Seguridad v4 • Modo Vista Previa",
        quantum_synced: "Sincronización Cuántica",
        wallet: "Billetera",
        equity_value: "Valor de Equidad",
        account_tier: "Nivel de Cuenta",
        pnl_24h: "PnL 24h",
        success_rate: "Tasa de Éxito",
        performance_matrix: "Matriz de Rendimiento",
        market_intel: "Inteligencia de Mercado",
        open_bot: "Abrir Motor Bot",
        view_signals: "Ver Señales en Vivo",
        live_control: "Control Bot en Vivo",
        account_status: "Estado de Cuenta",
        recent_ops: "Operaciones Recientes",
        security_title: "Seguridad Institucional",
        security_desc: "Todas las ejecuciones se procesan a través de nuestro nodo privado cifrado en Binance."
    },
    bots: {
        offline_msg: "Motor IA Desconectado",
        activate_link: "Activar Enlace Neuronal",
        terminate: "Terminar Motor",
        initialize: "Iniciar Motor",
        leverage_proto: "Protocolo_Apalancamiento",
        link_status: "Estado_Enlace_Neuronal",
        operational: "Operativo",
        awaiting_input: "Esperando_Entrada",
        simulation_active: "Simulación_Activa",
        advanced_matrix: "Matriz_Avanzada",
        strategy_engine: "Motor_Estrategia",
        graph_conviction: "Convicción_Gráfico (AT)",
        news_sentiment: "Sentimiento_Noticias (IA)",
        global_session: "Sesión_Global",
        neural_synergy: "Sinergia_Neuronal",
        high_conviction: "Alta_Convicción",
        analyzing: "Analizando",
        inst_access: "Acceso Institucional",
        exclusive_msg: "El motor de trading IA en vivo es exclusivo para suscriptores Pro y Élite.",
        upgrade_plan: "Mejorar Plan"
    },
    demo: {
        title: "Bot de Trading Demo",
        active_mode: "Simulación Activa • Modo Paper Trading",
        paused_mode: "Simulación Pausada • Listo para Iniciar",
        start: "Iniciar Demo",
        pause: "Pausar",
        reset: "Reiniciar",
        balance: "Balance",
        total_trades: "Total Operaciones",
        total_pnl: "PnL Total",
        win_rate: "Tasa de Victoria",
        execution_log: "Registro de Ejecución",
        recent_trades: "Operaciones Recientes",
        asset: "Activo",
        side: "Lado",
        entry: "Entrada",
        pnl: "PNL",
        status: "Estado",
        info_title: "Modo Demo - Paper Trading",
        info_desc: "Este es un entorno simulado. No hay fondos reales en riesgo.",
        waiting: "Esperando Inicio...",
        active_status: "Activo",
        standby_status: "En Espera"
    },
    market: {
        title: "Inteligencia de Mercado",
        subtitle: "Flujo Neuronal en Vivo • Motor TradingView",
        all: "Todos",
        gainers: "Ganadores",
        losers: "Perdedores",
        favs: "Favoritos",
        search: "BUSCAR PROTOCOLOS...",
        live_feed: "Flujo de Intercambio en Vivo"
    },
    settings: {
        title: "Ajustes",
        subtitle: "Neural Flow • Configuración Operacional",
        tabs: {
            identity: "Identidad",
            neural_link: "Enlace Neuronal",
            comms: "Enlace Comms",
            engine: "Lógica Motor",
            security: "Seguridad"
        },
        alias: "Alias Operacional",
        email: "Canal Seguro (Email)",
        api_key: "Clave API Exchange",
        secret_key: "Clave Secreta Exchange",
        tg_token: "Token Autenticación Bot",
        tg_chat_id: "ID Chat Objetivo",
        auto_trade: "Protocolo Auto-Trade",
        risk_notifications: "Notificaciones Escudo Riesgo",
        sync_data: "Sincronizar Datos",
        save_success: "Flujo de Inteligencia Sincronizado",
        browser_ext: "Extensión Navegador Antigravity",
        ext_status: "Estado Extensión"
    },
    subscription: {
        title: "Facturación y Planes",
        subtitle: "Administra tu suscripción, historial y métodos de pago.",
        elite_active: "Protocolo Élite Activo",
        standard_account: "Cuenta Estándar",
        inst_tier: "Nivel Institucional",
        elite_desc: "Sincronización Motor Neuronal al 100%. Prioridad en ejecución.",
        free_desc: "Estás explorando nuestras funciones gratuitas.",
        activate: "Activar Protocolo Élite",
        view_billing: "Matriz de Facturación",
        view_comparison: "Ver Comparación",
        wallets: "Billeteras Neuronales Vinculadas",
        invoices: "Facturas de Inteligencia",
        protection: "Protección de Cuenta"
    }
  },
  fr: {
    hero: {
      title_line1: "Tradez Comme",
      title_line2: "La Machine.",
      subtitle: "J'ai créé Neural Flow pour combler le fossé entre les particuliers et les institutions. Consolidation de l'analyse graphique et du sentiment d'actualité en temps réel.",
      cta_primary: "Lancer le Moteur",
      cta_secondary: "Explorer l'Intelligence",
      stat_lat: "Latence",
      stat_up: "Disponibilité",
      stat_sig: "Signaux Neuronaux"
    },
    header: {
        signin: "Connexion",
        get_started: "Commencer",
        dashboard: "Tableau de Bord",
        logout: "Déconnexion"
    },
    nav: {
        overview: "Vue d'ensemble",
        live_bot: "Bot en Direct",
        demo_bot: "Bot Démo",
        market: "Marché",
        subscription: "Abonnement",
        settings: "Paramètres",
        site_home: "Accueil",
        trade: "Trader",
        profile: "Profil",
        wallet: "Portefeuille",
        logs: "Journaux"
    },
    sidebar: {
        command_center: "Centre de Commande",
        elite_protocol: "Protocole Élite",
        elite_desc: "Activez les bots de trading automatisés et l'IA de sentiment.",
        unlock: "Tout Débloquer",
        active_modules: "Modules Actifs",
        binance_proto: "Protocole Binance",
        ops_cloud: "Nuage d'Opérations"
    },
    dashboard: {
        title: "Commande Neuronale",
        elite_active: "Intelligence Élite Active • En Direct",
        free_preview: "Protocole de Sécurité v4 • Mode Aperçu",
        quantum_synced: "Sync Quantique",
        wallet: "Portefeuille",
        equity_value: "Valeur des Capitaux",
        account_tier: "Niveau de Compte",
        pnl_24h: "PnL 24h",
        success_rate: "Taux de Réussite",
        performance_matrix: "Matrice de Performance",
        market_intel: "Intelligence de Marché",
        open_bot: "Ouvrir Moteur Bot",
        view_signals: "Voir Signaux",
        live_control: "Contrôle Bot",
        account_status: "Statut du Compte",
        recent_ops: "Opérations Récentes",
        security_title: "Sécurité Institutionnelle",
        security_desc: "Toutes les exécutions passent par notre nœud privé crypté sur Binance."
    },
    bots: {
        offline_msg: "Moteur IA Hors Ligne",
        activate_link: "Activer Liaison Neuronale",
        terminate: "Terminer Moteur",
        initialize: "Initialiser Moteur",
        leverage_proto: "Protocole_Levier",
        link_status: "Statut_Liaison",
        operational: "Opérationnel",
        awaiting_input: "Attente_Entrée",
        simulation_active: "Simulation_Active",
        advanced_matrix: "Matrice_Avancée",
        strategy_engine: "Moteur_Stratégie",
        graph_conviction: "Conviction_Graph (AT)",
        news_sentiment: "Sentiment_News (IA)",
        global_session: "Session_Globale",
        neural_synergy: "Synergie_Neuronale",
        high_conviction: "Haute_Conviction",
        analyzing: "Analyse_En_Cours",
        inst_access: "Accès Institutionnel",
        exclusive_msg: "Le moteur de trading IA en direct est réservé aux abonnés Pro et Élite.",
        upgrade_plan: "Mettre à Niveau"
    },
    demo: {
        title: "Bot de Trading Démo",
        active_mode: "Simulation Active • Mode Paper Trading",
        paused_mode: "Simulation En Pause • Prêt",
        start: "Lancer Démo",
        pause: "Pause",
        reset: "Réinitialiser",
        balance: "Solde",
        total_trades: "Total Trades",
        total_pnl: "PnL Total",
        win_rate: "Taux de Gain",
        execution_log: "Journal d'Exécution",
        recent_trades: "Trades Récents",
        asset: "Actif",
        side: "Côté",
        entry: "Entrée",
        pnl: "PNL",
        status: "Statut",
        info_title: "Mode Démo - Paper Trading",
        info_desc: "Environnement simulé. Aucun fonds réel n'est en danger.",
        waiting: "En attente...",
        active_status: "Actif",
        standby_status: "En Veille"
    },
    market: {
        title: "Intelligence de Marché",
        subtitle: "Flux Neuronal en Direct • Moteur TradingView",
        all: "Tous",
        gainers: "Gagnants",
        losers: "Perdants",
        favs: "Favoris",
        search: "RECHERCHER PROTOCOLES...",
        live_feed: "Flux d'Échange en Direct"
    },
    settings: {
        title: "Paramètres",
        subtitle: "Neural Flow • Configuration Opérationnelle",
        tabs: {
            identity: "Identité",
            neural_link: "Liaison Neuronale",
            comms: "Liaison Comms",
            engine: "Logique Moteur",
            security: "Sécurité"
        },
        alias: "Alias Opérationnel",
        email: "Canal Sécurisé (Email)",
        api_key: "Clé API Échange",
        secret_key: "Clé Secrète Échange",
        tg_token: "Jeton Auth Bot",
        tg_chat_id: "ID Chat Cible",
        auto_trade: "Protocole Auto-Trade",
        risk_notifications: "Notif. Bouclier Risque",
        sync_data: "Synchroniser Données",
        save_success: "Flux d'Intelligence Synchronisé",
        browser_ext: "Extension Navigateur Antigravity",
        ext_status: "Statut Extension"
    },
    subscription: {
        title: "Facturation et Plans",
        subtitle: "Gérez votre abonnement et vos méthodes de paiement.",
        elite_active: "Protocole Élite Actif",
        standard_account: "Compte Standard",
        inst_tier: "Niveau Institutionnel",
        elite_desc: "Synchronisation Moteur 100%. Priorité d'exécution.",
        free_desc: "Vous explorez nos fonctionnalités gratuites.",
        activate: "Activer Protocole Élite",
        view_billing: "Matrice de Facturation",
        view_comparison: "Voir Comparaison",
        wallets: "Portefeuilles Liés",
        invoices: "Factures d'Intelligence",
        protection: "Protection de Compte"
    }
  },
  de: {
    hero: {
      title_line1: "Handeln wie",
      title_line2: "Die Maschine.",
      subtitle: "Ich habe Neural Flow gebaut, um die Lücke zwischen Einzelhandel und Institutionen zu schließen. Konsolidierung von Live-Chart-Intelligence und Echtzeit-Nachrichtensentiment.",
      cta_primary: "Motor Starten",
      cta_secondary: "Intelligenz Erkunden",
      stat_lat: "Latenz",
      stat_up: "Betriebszeit",
      stat_sig: "Neuronale Signale"
    },
    header: {
        signin: "Anmelden",
        get_started: "Starten",
        dashboard: "Dashboard",
        logout: "Abmelden"
    },
    nav: {
        overview: "Übersicht",
        live_bot: "Live-Bot",
        demo_bot: "Demo-Bot",
        market: "Markt",
        subscription: "Abonnement",
        settings: "Einstellungen",
        site_home: "Startseite",
        trade: "Handeln",
        profile: "Profil",
        wallet: "Brieftasche",
        logs: "Protokolle"
    },
    sidebar: {
        command_center: "Kommandozentrale",
        elite_protocol: "Elite-Protokoll",
        elite_desc: "Aktivieren Sie vollautomatische Trading-Bots und KI.",
        unlock: "Alles Freischalten",
        active_modules: "Aktive Module",
        binance_proto: "Binance-Protokoll",
        ops_cloud: "Operations-Cloud"
    },
    dashboard: {
        title: "Neuronales Kommando",
        elite_active: "Elite-Intelligenz Aktiv • Live-Feed",
        free_preview: "Sicherheitsprotokoll v4 • Vorschaumodus",
        quantum_synced: "Quanten-Synchronisiert",
        wallet: "Brieftasche",
        equity_value: "Eigenkapitalwert",
        account_tier: "Kontostufe",
        pnl_24h: "24h PnL",
        success_rate: "Erfolgsrate",
        performance_matrix: "Leistungsmatrix",
        market_intel: "Marktintelligenz",
        open_bot: "Bot-Motor Öffnen",
        view_signals: "Live-Signale Ansehen",
        live_control: "Live-Bot-Steuerung",
        account_status: "Kontostatus",
        recent_ops: "Aktuelle Operationen",
        security_title: "Institutionelle Sicherheit",
        security_desc: "Alle Ausführungen werden über unseren verschlüsselten privaten Knoten auf Binance verarbeitet."
    },
    bots: {
        offline_msg: "KI-Motor Offline",
        activate_link: "Neuronale Verbindung Aktivieren",
        terminate: "Motor Beenden",
        initialize: "Motor Initialisieren",
        leverage_proto: "Hebelwirkung_Protokoll",
        link_status: "Verbindungsstatus",
        operational: "Betriebsbereit",
        awaiting_input: "Warten_Auf_Eingabe",
        simulation_active: "Simulation_Aktiv",
        advanced_matrix: "Erweiterte_Matrix",
        strategy_engine: "Strategie_Motor",
        graph_conviction: "Chart_Überzeugung (TA)",
        news_sentiment: "News_Stimmung (KI)",
        global_session: "Globale_Sitzung",
        neural_synergy: "Neuronale_Synergie",
        high_conviction: "Hohe_Überzeugung",
        analyzing: "Analysieren",
        inst_access: "Nur Institutioneller Zugang",
        exclusive_msg: "Der Live-KI-Handelsmotor ist exklusiv für Pro- & Elite-Abonnenten.",
        upgrade_plan: "Plan Aktualisieren"
    },
    demo: {
        title: "Demo-Handelsbot",
        active_mode: "Simulation Aktiv • Paper Trading Modus",
        paused_mode: "Simulation Pausiert • Bereit",
        start: "Demo Starten",
        pause: "Pause",
        reset: "Zurücksetzen",
        balance: "Guthaben",
        total_trades: "Gesamt Trades",
        total_pnl: "Gesamt PnL",
        win_rate: "Gewinnrate",
        execution_log: "Ausführungsprotokoll",
        recent_trades: "Letzte Trades",
        asset: "Asset",
        side: "Seite",
        entry: "Einstieg",
        pnl: "PNL",
        status: "Status",
        info_title: "Demo-Modus - Paper Trading",
        info_desc: "Dies ist eine simulierte Umgebung. Kein echtes Geld ist gefährdet.",
        waiting: "Warte auf Start...",
        active_status: "Aktiv",
        standby_status: "Bereitschaft"
    },
    market: {
        title: "Marktintelligenz",
        subtitle: "Live-Neuronaler-Strom • TradingView Motor",
        all: "Alle",
        gainers: "Gewinner",
        losers: "Verlierer",
        favs: "Favoriten",
        search: "PROTOKOLLE SUCHEN...",
        live_feed: "Live-Börsen-Feed"
    },
    settings: {
        title: "Einstellungen",
        subtitle: "Neural Flow • Operationale Konfiguration",
        tabs: {
            identity: "Identität",
            neural_link: "Neuronale Verbindung",
            comms: "Komm-Verbindung",
            engine: "Motor-Logik",
            security: "Sicherheit"
        },
        alias: "Operationaler Alias",
        email: "Sicherer Kanal (Email)",
        api_key: "Börsen-API-Schlüssel",
        secret_key: "Börsen-Geheimschlüssel",
        tg_token: "Bot-Authentifizierungs-Token",
        tg_chat_id: "Ziel-Chat-ID",
        auto_trade: "Auto-Trade-Protokoll",
        risk_notifications: "Risikoschild-Benachrichtigungen",
        sync_data: "Daten Synchronisieren",
        save_success: "Intelligenz-Strom Synchronisiert",
        browser_ext: "Antigravity Browser-Erweiterung",
        ext_status: "Erweiterungsstatus"
    },
    subscription: {
        title: "Abrechnung & Pläne",
        subtitle: "Verwalten Sie Ihr Abonnement und Ihre Zahlungsmethoden.",
        elite_active: "Elite-Protokoll Aktiv",
        standard_account: "Standardkonto",
        inst_tier: "Institutionelle Stufe",
        elite_desc: "Neuronale Motor-Synchronisation bei 100%. Priorität bei der Ausführung.",
        free_desc: "Sie erkunden derzeit unsere kostenlosen Funktionen.",
        activate: "Elite-Protokoll Aktivieren",
        view_billing: "Abrechnungsmatrix",
        view_comparison: "Vergleich Anzeigen",
        wallets: "Verknüpfte Wallets",
        invoices: "Intelligenz-Rechnungen",
        protection: "Kontoschutz"
    }
  },
  ar: {
    hero: {
      title_line1: "تاجر مثل",
      title_line2: "الآلة.",
      subtitle: "لقد بنيت Neural Flow للقضاء على الفجوة بين الأفراد والمؤسسات. دمج ذكاء الرسوم البيانية الحية ومشاعر الأخبار في الوقت الفعلي في بروتوكول آلي واحد.",
      cta_primary: "بدء المحرك",
      cta_secondary: "استكشاف الذكاء",
      stat_lat: "الكمون",
      stat_up: "وقت التشغيل",
      stat_sig: "إشارات عصبية"
    },
    header: {
        signin: "دخول",
        get_started: "ابدأ",
        dashboard: "لوحة التحكم",
        logout: "خروج"
    },
    nav: {
        overview: "نظرة عامة",
        live_bot: "بوت مباشر",
        demo_bot: "بوت تجريبي",
        market: "السوق",
        subscription: "الاشتراك",
        settings: "الإعدادات",
        site_home: "الرئيسية",
        trade: "تداول",
        profile: "الملف الشخصي",
        wallet: "المحفظة",
        logs: "السجلات"
    },
    sidebar: {
        command_center: "مركز القيادة",
        elite_protocol: "بروتوكول النخبة",
        elite_desc: "تفعيل التداول الآلي وذكاء الأخبار.",
        unlock: "فتح كل شيء",
        active_modules: "الوحدات النشطة",
        binance_proto: "بروتوكول بينانس",
        ops_cloud: "سحابة العمليات"
    },
    dashboard: {
        title: "القيادة العصبية",
        elite_active: "ذكاء النخبة نشط • تغذية حية",
        free_preview: "بروتوكول الأمان v4 • وضع المعاينة",
        quantum_synced: "متزامن كمياً",
        wallet: "المحفظة",
        equity_value: "قيمة الأسهم",
        account_tier: "مستوى الحساب",
        pnl_24h: "الربح/الخسارة 24 ساعة",
        success_rate: "معدل النجاح",
        performance_matrix: "مصفوفة الأداء",
        market_intel: "ذكاء السوق",
        open_bot: "فتح محرك البوت",
        view_signals: "عرض الإشارات الحية",
        live_control: "تحكم البوت المباشر",
        account_status: "حالة الحساب",
        recent_ops: "العمليات الأخيرة",
        security_title: "أمان مؤسسي",
        security_desc: "تتم معالجة جميع التنفيذات من خلال عقدتنا الخاصة المشفرة على بينانس."
    },
    bots: {
        offline_msg: "محرّك الذكاء الاصطناعي غير متصل",
        activate_link: "تفعيل الرابط العصبي",
        terminate: "إنهاء المحرك",
        initialize: "بدء المحرك",
        leverage_proto: "بروتوكول_الرافعة",
        link_status: "حالة_الرابط_العصبي",
        operational: "تشغيلي",
        awaiting_input: "بانتظار_الإدخال",
        simulation_active: "محاكاة_نشطة",
        advanced_matrix: "مصفوفة_متقدمة",
        strategy_engine: "محرك_الاستراتيجية",
        graph_conviction: "قناعة_الرسم_البياني",
        news_sentiment: "مشاعر_الأخبار",
        global_session: "الجلسة_العالمية",
        neural_synergy: "التآزر_العصبي",
        high_conviction: "قناعة_عالية",
        analyzing: "جاري_التحليل",
        inst_access: "وصول مؤسسي فقط",
        exclusive_msg: "محرك التداول بالذكاء الاصطناعي المباشر متاح حصريًا لمشتركي Pro و Elite.",
        upgrade_plan: "ترقية الخطة"
    },
    demo: {
        title: "بوت التداول التجريبي",
        active_mode: "محاكاة نشطة • تداول ورقي",
        paused_mode: "المحاكاة مؤقتة • جاهز للبدء",
        start: "بدء التشغيل",
        pause: "إيقاف مؤقت",
        reset: "إعادة تعيين",
        balance: "الرصيد",
        total_trades: "إجمالي الصفقات",
        total_pnl: "إجمالي الربح/الخسارة",
        win_rate: "معدل الفوز",
        execution_log: "سجل التنفيذ",
        recent_trades: "الصفقات الأخيرة",
        asset: "الأصل",
        side: "الجانب",
        entry: "الدخول",
        pnl: "الربح/الخسارة",
        status: "الحالة",
        info_title: "وضع تجريبي - تداول ورقي",
        info_desc: "هذه بيئة محاكاة. لا توجد أموال حقيقية في خطر.",
        waiting: "في انتظار البدء...",
        active_status: "نشط",
        standby_status: "استعداد"
    },
    market: {
        title: "ذكاء السوق",
        subtitle: "بث عصبي مباشر • محرك TradingView",
        all: "الكل",
        gainers: "الرابحون",
        losers: "الخاسرون",
        favs: "المفضلة",
        search: "بحث في البروتوكولات...",
        live_feed: "بث التبادل المباشر"
    },
    settings: {
        title: "الإعدادات",
        subtitle: "التدفق العصبي • التكوين التشغيلي",
        tabs: {
            identity: "الهوية",
            neural_link: "الرابط العصبي",
            comms: "رابط الاتصالات",
            engine: "منطق المحرك",
            security: "الأمان"
        },
        alias: "الاسم المستعار التشغيلي",
        email: "القناة الآمنة (البريد الإلكتروني)",
        api_key: "مفتاح API للتبادل",
        secret_key: "المفتاح السري للتبادل",
        tg_token: "رمز مصادقة البوت",
        tg_chat_id: "معرف الدردشة المستهدف",
        auto_trade: "بروتوكول التداول الآلي",
        risk_notifications: "إشعارات درع المخاطر",
        sync_data: "مزامنة البيانات",
        save_success: "تمت موازنة تدفق الذكاء",
        browser_ext: "إضافة متصفح Antigravity",
        ext_status: "حالة الإضافة"
    },
    subscription: {
        title: "الفوترة والخطط",
        subtitle: "إدارة اشتراكك وسجل الفواتير وطرق الدفع.",
        elite_active: "بروتوكول النخبة نشط",
        standard_account: "حساب قياسي",
        inst_tier: "المستوى المؤسسي",
        elite_desc: "مزامنة المحرك العصبي بنسبة 100٪. أولوية التنفيذ.",
        free_desc: "أنت تستكشف حاليًا ميزاتنا المجانية.",
        activate: "تفعيل بروتوكول النخبة",
        view_billing: "مصفوفة الفوترة",
        view_comparison: "عرض المقارنة",
        wallets: "المحافظ المرتبطة",
        invoices: "فواتير الاستخبارات",
        protection: "حماية الحساب"
    }
  }
};

type TranslationState = typeof translations.en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationState;
  textDir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem("language") as Language;
    if (saved && translations[saved]) {
      setLanguage(saved);
      // Apply direction initial load
      if (saved === "ar") {
          document.documentElement.dir = "rtl";
          document.documentElement.lang = "ar";
      } else {
          document.documentElement.dir = "ltr";
          document.documentElement.lang = saved;
      }
    }
  }, []);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
    
    // Simple way to handle RTL for Arabic
    if (lang === "ar") {
        document.documentElement.dir = "rtl";
        document.documentElement.lang = "ar";
    } else {
        document.documentElement.dir = "ltr";
        document.documentElement.lang = lang;
    }
  };

  return (
    <LanguageContext.Provider 
      value={{ 
        language, 
        setLanguage: changeLanguage, 
        t: translations[language], 
        textDir: language === "ar" ? "rtl" : "ltr" 
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
