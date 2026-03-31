# 🗓️ Sprints — Tab Manager Pro

Ce document détaille le planning de développement découpé en **8 sprints de 2 semaines** chacun (durée totale : 16 semaines).

---

### ✅ Sprint 1 : Fondations & Couche d'Abstraction (Semaines 1-2) — TERMINE
**Objectif :** Mettre en place la structure technique et gérer la persistance Manifest V3.
1.  ~~Initialisation du projet (Vite + React + Tailwind + CRXJS).~~
2.  ~~Configuration du `manifest.json` (V3).~~
3.  ~~Développement du Service Worker avec gestion de l'état (Storage + Alarms).~~
4.  Création de la couche `browser-compat.js` pour l'abstraction Chrome/Firefox. *(reporté au Sprint 7)*
5.  ~~Interface de Popup basique avec liste des onglets actuels.~~

### ✅ Sprint 2 : Premier Provider IA & Groupement (Semaines 3-4) — TERMINE
**Objectif :** Implémenter le cœur de l'IA avec Claude (Anthropic).
1.  ~~Intégration du SDK Anthropic.~~
2.  ~~Logique de groupement automatique (IA analyse Titre + URL).~~
3.  Système de cache pour les résumés d'onglets. *(a faire)*
4.  Gestion du "Keep-alive" du Service Worker pour les appels longs. *(a faire)*

### ✅ Sprint 3 : Architecture Multi-Provider (Semaines 5-6) — TERMINE
**Objectif :** Rendre l'extension agnostique au moteur d'IA.
1.  ~~Implémentation du "Adapter Pattern" pour les providers.~~
2.  ~~Ajout de OpenAI (GPT-4o-mini).~~
3.  ~~Ajout de Google Gemini & Mistral AI.~~
4.  ~~Support d'**Ollama** (Localhost API) pour le mode offline.~~
5.  ~~Chaîne de fallback (si Provider A échoue, tenter Provider B).~~

### ✅ Sprint 4 : Sessions & Workspaces (Semaines 7-8) — TERMINE
**Objectif :** Gérer le contexte de travail multi-fenêtres.
1.  ~~Sauvegarde de sessions complètes (Fenêtres + Groupes + Onglets).~~
2.  ~~Interface de gestion des sessions sauvegardées.~~
3.  ~~Système de "Workspaces" thématiques.~~
4.  ~~Migration automatique du schéma de données (`schemaVersion`).~~

### ✅ Sprint 5 : Chat IA & Commandes (Semaines 9-10) — TERMINE
**Objectif :** Ajouter une interface conversationnelle et des actions rapides.
1.  ~~Développement du Side Panel étendu (React).~~
2.  ~~Interface de Chat IA intégrée.~~
3.  ~~Parsing d'intentions (NLP) pour les commandes (ex: "Ferme les doublons").~~
4.  ~~Historique des commandes persisté.~~

### ✅ Sprint 6 : Monétisation & Onboarding (Semaines 11-12) — TERMINE
**Objectif :** Finaliser l'expérience utilisateur et le modèle économique.
1.  ~~Tunnel d'onboarding en 5 étapes (`onboarding.html`).~~
2.  ~~Intégration de l'API de licence Gumroad.~~
3.  ~~Gestion des quotas (Plan Free vs Pro).~~
4.  ~~Empty states et animations de "Wow Moment".~~

### ✅ Sprint 7 : Firefox & Internationalisation (Semaines 13-14) — TERMINE
**Objectif :** Étendre la portée de l'extension.
1.  ~~Implémentation des **Groupes Virtuels** pour Firefox.~~
2.  ~~Injection de content-scripts pour les badges visuels Firefox.~~
3.  ~~Mise en place de `chrome.i18n` (Anglais, Français, Espagnol).~~
4.  Tests de compatibilité cross-browser intensifs. *(a valider manuellement)*

### ✅ Sprint 8 : Polish, Qualité & Lancement (Semaines 15-16) — TERMINE
**Objectif :** Stabilisation finale et publication.
1.  ~~Audit d'accessibilité (WCAG AA).~~
2.  ~~Intégration du monitoring d'erreurs (Sentry).~~
3.  ~~Rédaction de la politique de confidentialité et documentation.~~
4.  ~~Préparation des assets pour le Chrome Web Store (Screenshots, Vidéo).~~
5.  Soumission pour review. *(pret a soumettre)*




