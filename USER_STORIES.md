# 📋 User Stories — Tab Manager Pro

Ce document détaille les User Stories (US) pour le développement de l'extension **Tab Manager Pro**, classées par modules fonctionnels.

---

## 🚀 1. Onboarding & Configuration IA
*Objectif : Permettre à l'utilisateur de configurer son moteur d'IA et de comprendre la valeur du produit dès l'installation.*

### US 1.1 : Premier lancement (First-Run Experience)
**En tant qu'** utilisateur venant d'installer l'extension,
**je veux** être guidé par un tunnel de configuration interactif,
**afin de** configurer ma clé API et de voir une démonstration immédiate du produit.
*   **Critères d'acceptation :**
    *   Ouverture automatique de `onboarding.html` à l'installation.
    *   Sélection visuelle du provider (Claude, OpenAI, Gemini, etc.).
    *   Validation en temps réel de la clé API via un bouton "Tester".
    *   Déclenchement d'un premier groupement automatique à la fin du tunnel.

### US 1.2 : Gestion Multi-Provider
**En tant qu'** utilisateur avancé,
**je veux** pouvoir enregistrer plusieurs clés API et changer de modèle (ex: passer de Claude à GPT-4),
**afin de** comparer les résultats ou d'utiliser mes crédits disponibles.
*   **Critères d'acceptation :**
    *   Interface dédiée dans les options pour gérer chaque provider.
    *   Indicateur visuel de validité (Vert/Rouge) pour chaque clé.
    *   Possibilité de définir un ordre de "fallback" automatique en cas d'erreur 429 (Rate limit).

---

## 🗂️ 2. Gestion & Organisation des Onglets (IA)
*Objectif : Transformer le chaos des onglets en espaces organisés sans effort manuel.*

### US 2.1 : Groupement automatique à l'ouverture
**En tant qu'** utilisateur naviguant sur le web,
**je veux** que mes nouveaux onglets soient automatiquement classés dans le bon groupe,
**afin de** maintenir mon navigateur organisé en permanence.
*   **Critères d'acceptation :**
    *   Analyse sémantique (IA) du titre et de l'URL après chargement.
    *   Placement automatique dans un groupe Chrome (ou virtuel sur Firefox).
    *   Notification discrète via badge ou tooltip confirmant l'action.

### US 2.2 : Réorganisation massive (Batch Grouping)
**En tant qu'** utilisateur avec 50+ onglets ouverts,
**je veux** cliquer sur un bouton unique pour tout ranger d'un coup,
**afin de** retrouver instantanément de la clarté dans ma session de travail.
*   **Critères d'acceptation :**
    *   Bouton "Tout regrouper" dans le popup.
    *   Envoi optimisé des titres/URLs à l'IA pour minimiser les tokens.
    *   Animation de transition fluide lors du déplacement des onglets.

---

## 🔍 3. Intelligence & Recherche
*Objectif : Accéder rapidement à l'information contenue dans les onglets.*

### US 3.1 : Recherche Sémantique
**En tant qu'** utilisateur distrait,
**je veux** rechercher un onglet en tapant une intention (ex: "le truc sur Stripe") plutôt qu'un mot-clé exact,
**afin de** trouver mes sources d'information plus rapidement.
*   **Critères d'acceptation :**
    *   Barre de recherche hybride (Locale -> IA).
    *   Affichage d'un score de pertinence ou d'un highlight sur les résultats.
    *   Focus automatique sur l'onglet lors du clic.

### US 3.2 : Résumé au survol
**En tant qu'** utilisateur parcourant ma liste d'onglets,
**je veux** voir un résumé en une phrase du contenu de la page en la survolant,
**afin de** décider si je dois garder l'onglet ouvert ou le fermer.
*   **Critères d'acceptation :**
    *   Affichage du résumé après 800ms de survol dans l'UI de l'extension.
    *   Mise en cache du résumé pour éviter les appels API redondants.
    *   Loader visuel pendant la génération IA.

---

## ⚡ 4. Performance & Sessions
*Objectif : Économiser la RAM et sauvegarder le contexte de travail.*

### US 4.1 : Suspension intelligente d'onglets (Tab Suspender)
**En tant qu'** utilisateur soucieux de la performance de mon PC,
**je veux** que l'IA mette en veille les onglets inutilisés mais importants,
**afin de** libérer de la RAM sans perdre mon travail.
*   **Critères d'acceptation :**
    *   Détection des onglets inactifs selon un seuil configurable (ex: 30 min).
    *   Intelligence : Ne jamais suspendre un onglet avec un formulaire en cours ou un média actif.
    *   Indicateur de RAM économisée affiché dans l'UI.

### US 4.2 : Gestion des Sessions & Workspaces
**En tant qu'** utilisateur multi-projets,
**je veux** sauvegarder un ensemble d'onglets sous forme de session nommée par l'IA,
**afin de** basculer entre mes contextes (ex: "Dev Projet A" vs "Admin") facilement.
*   **Critères d'acceptation :**
    *   Nommage automatique de la session par l'IA basé sur le contenu.
    *   Possibilité de restaurer une session dans une nouvelle fenêtre.
    *   Synchronisation des sessions (optionnelle) ou export JSON.

---

## 🦊 5. Compatibilité & Accessibilité
*Objectif : Garantir une expérience fluide sur tous les navigateurs et pour tous les profils.*

### US 5.1 : Expérience Firefox (Groupes Virtuels)
**En tant qu'** utilisateur Firefox,
**je veux** pouvoir utiliser les groupes d'onglets malgré l'absence de l'API native,
**afin d'** avoir le même niveau d'organisation que sur Chrome.
*   **Critères d'acceptation :**
    *   Système de groupes "virtuels" géré en stockage local.
    *   Badges visuels injectés sur les pages pour simuler les couleurs de groupe.

### US 5.2 : Accessibilité (a11y)
**En tant qu'** utilisateur navigant au clavier,
**je veux** pouvoir gérer mes onglets sans souris,
**afin de** rester productif et respecter les standards WCAG.
*   **Critères d'acceptation :**
    *   Navigation complète via `Tab` et raccourcis clavier.
    *   Compatibilité avec les lecteurs d'écran (Labels ARIA).
    *   Support du mode contraste élevé.

---

## 🛡️ 6. Sécurité & Monétisation
*Objectif : Protéger les données et valider la licence.*

### US 6.1 : Protection des Clés API
**En tant qu'** utilisateur soucieux de ma sécurité,
**je veux** que mes clés API soient stockées de manière chiffrée localement,
**afin de** garantir qu'aucune application tierce ne puisse les voler.
*   **Critères d'acceptation :**
    *   Chiffrement des clés avant stockage dans `chrome.storage.local`.
    *   Aucun envoi de clé vers un serveur tiers (hors provider IA).

### US 6.2 : Validation de Licence Pro
**En tant qu'** acheteur du plan Pro sur Gumroad,
**je veux** activer mon extension avec ma clé de licence,
**afin de** débloquer l'usage illimité et les fonctionnalités avancées.
*   **Critères d'acceptation :**
    *   Champ de saisie de licence dans les options.
    *   Appel à l'API Gumroad pour vérification.
    *   Mode "Grace Period" (7 jours) en cas d'absence de connexion internet.
