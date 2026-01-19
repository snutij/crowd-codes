---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: []
session_topic: 'MVP Crowd-Codes - Site de codes promo collaboratif sans pub'
session_goals: 'Définir le scope MVP, stack technique optimale à coût minimal, résoudre la gestion expiration'
selected_approach: 'ai-recommended'
techniques_used: ['First Principles Thinking', 'Resource Constraints', 'Question Storming']
ideas_generated: ['Parsing Hybride Regex + LLM', 'Feedback Loop Regex <- LLM', 'Recherche par Marque/Produit', 'Découverte par firehose filtrée', 'Scope géographique MVP = France', 'Architecture Zero Backend', 'Buffer de sécurité LLM', 'Batching LLM', 'LLM génère les regex automatiquement', 'Auto-PR pour nouvelles regex', 'Test Dataset pour validation regex', 'Seuil adaptatif', 'UX Brutalist Code-First']
session_active: false
workflow_completed: true
---

# Brainstorming Session Results

**Facilitator:** Justin
**Date:** 2026-01-18

---

## Session Overview

**Topic:** MVP Crowd-Codes - Site de codes promo collaboratif, transparent, sans pub ni partenariat

**Goals:**
- Affiner l'idée produit et définir le scope MVP
- Identifier la stack technique optimale à coût ~0
- Résoudre les questions ouvertes (expiration, architecture)

### Concept Initial

| Aspect | Vision |
|--------|--------|
| **Problème** | Sites de codes promo existants = pubs intrusives + partenariats = manque de fiabilité |
| **Solution** | Plateforme collaborative, transparente, sans pub, sans partenariat |
| **Philosophie** | Open source, "si quelqu'un fork, tant mieux" |

### Scope MVP Défini

| In MVP | Hors MVP |
|--------|----------|
| Scrapping YouTube (descriptions influenceurs) | Soumission communautaire |
| Recherche simple (champ texte → nom de marque) | Système de votes |
| Affichage des codes trouvés | Auto-archivage par downvotes |
| Scrapping quotidien | Extensions navigateur |
| Coût minimal (fonds propres) | Comptes utilisateurs |
| France uniquement | Multi-pays |

---

## Technique Selection

**Approach:** AI-Recommended Techniques
**Analysis Context:** MVP technique avec contraintes de coût extrêmes

**Techniques utilisées:**

1. **First Principles Thinking** — Challenger les hypothèses implicites, valider les fondations
2. **Resource Constraints** — Forcer la créativité sous contrainte budget ~0
3. **Question Storming** — Identifier les questions ouvertes avant de chercher les réponses

---

## Technique Execution Results

### First Principles Thinking

**Hypothèses challengées et validées :**

1. **Source YouTube** — Validé avec exemples concrets (Lokan, Nowtech, etc.) et référence externe (MeetSponsors par Benjamin Code)

2. **Parsing des descriptions** — Complexité identifiée : formats très variés, mélange codes + liens affiliés
   - Décision : MVP = codes uniquement, liens affiliés = futur

3. **Recherche** — Pivot important : recherche par **marque/produit** (pas par site e-commerce)
   - Simplifie énormément le MVP
   - Les données YouTube mentionnent déjà les marques naturellement

4. **Validation externe** — MeetSponsors (meetsponsors.com) prouve que le parsing YouTube à grande échelle est faisable

### Resource Constraints

**Architecture Zero Backend définie :**

```
GitHub Actions (cron quotidien)
    → YouTube Data API (search.list FR + date + mots-clés)
    → Parse descriptions (regex + LLM fallback)
    → SQLite (source of truth)
    → Export JSON statiques
    → Git push → Cloudflare Pages

Coût total : 0€/mois
```

**Stack technique :**

| Composant | Solution | Coût |
|-----------|----------|------|
| Scrapping/Cron | GitHub Actions | 0€ |
| YouTube API | Free tier (10k units/jour) | 0€ |
| LLM fallback | Gemini Flash free tier | 0€ |
| Base de données | SQLite dans le repo | 0€ |
| Hosting | Cloudflare Pages | 0€ |
| Recherche | Fuse.js côté client | 0€ |

### Question Storming

**Questions résolues :**

1. **Observabilité** — Logs GitHub Actions + `stats.json` dans le repo + page `/stats` sur le site

2. **Quotas API** — YouTube ~5000 vidéos/jour OK, LLM avec batching (10-20 desc/appel) = ~100-150 appels/jour OK

3. **Sécurité API keys** — GitHub Secrets, jamais dans le code, `.env.example` pour les forks

4. **Expiration des codes** — Hors scope MVP, tri par date décroissante (nouveaux en premier)

5. **Doublons** — Filtrage à l'export JSON ou côté UX

---

## Ideas Generated

### Theme 1: Architecture & Infrastructure

| # | Idée | Description |
|---|------|-------------|
| 6 | **Zero Backend** | GitHub Actions + SQLite + JSON + Cloudflare Pages = 0€/mois |
| 4 | **Firehose filtrée** | YouTube API search.list filtré par FR + date + mots-clés |
| 5 | **Scope FR** | France uniquement pour MVP |

### Theme 2: Parsing intelligent & Auto-amélioration

| # | Idée | Description |
|---|------|-------------|
| 1 | **Parsing hybride** | Regex first → LLM fallback |
| 2 | **Feedback loop** | LLM patterns → nouvelles regex |
| 8 | **Batching LLM** | 10-20 descriptions par appel pour économiser le quota |
| 9 | **LLM génère regex** | Le prompt demande aussi une regex suggérée |
| 10 | **Auto-PR** | GitHub Action ouvre une PR quand pattern récurrent (3×) |
| 11 | **Test dataset** | Fichier de référence pour valider les regex, éviter régressions |
| 12 | **Seuil adaptatif** | 3× par défaut pour PR, 5× si faux positifs |
| 7 | **Buffer LLM** | Si quota atteint, reporter les cas non-parsés au lendemain |

### Theme 3: Modèle de données & Recherche

| # | Idée | Description |
|---|------|-------------|
| 3 | **Recherche par marque** | Pas de mapping site e-commerce, indexation par marque |

### Theme 4: UX & Frontend

| # | Idée | Description |
|---|------|-------------|
| 13 | **UX Brutalist** | Champ recherche + codes copiables 1 clic + zero bloat |

---

## Architecture Finale

```
┌─────────────────────────────────────────────────────────────┐
│                    GITHUB ACTIONS (Cron)                    │
│                      Gratuit: 2000 min/mois                 │
├─────────────────────────────────────────────────────────────┤
│  1. Scrape YouTube API (vidéos FR, hier, "code promo"...)   │
│  2. Parse descriptions (regex + LLM fallback)               │
│  3. LLM suggère nouvelles regex si pattern récurrent        │
│  4. Stocke dans SQLite (codes.db)                           │
│  5. Exporte en JSON statiques                               │
│  6. Git push → déclenche deploy                             │
│  7. Auto-PR si nouvelle regex suggérée 3×                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      REPO GITHUB                            │
├─────────────────────────────────────────────────────────────┤
│  /data                                                      │
│    ├── codes.db          (SQLite - source of truth)         │
│    ├── index.json        (tous les codes, léger)            │
│    ├── brands/                                              │
│    │   ├── nordvpn.json                                     │
│    │   ├── cleanmymac.json                                  │
│    │   └── ...                                              │
│    └── stats.json        (observabilité)                    │
│  /tests                                                     │
│    └── reference-dataset.json (validation regex)            │
│  /src                                                       │
│    └── patterns.json     (regex patterns)                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              CLOUDFLARE PAGES (Site statique)               │
│                    Gratuit: unlimited requests              │
├─────────────────────────────────────────────────────────────┤
│  - HTML/CSS/JS minimal (Vanilla, ~5KB)                      │
│  - Charge index.json au load                                │
│  - Recherche fuzzy côté client (Fuse.js)                    │
│  - 1 clic = code copié                                      │
│  - Ultra rapide (CDN edge mondial)                          │
└─────────────────────────────────────────────────────────────┘
```

---

## UX Design

**Philosophie :** Anti-thèse des sites de codes promo actuels. Pas de pubs, pas de popups. Juste les codes.

**Homepage :**
```
┌─────────────────────────────────────────────────────────────┐
│                      🔍 crowd-codes                         │
│         ┌─────────────────────────────────┐                 │
│         │  Rechercher une marque...       │                 │
│         └─────────────────────────────────┘                 │
│           Dernière mise à jour : il y a 3h                  │
│           4 847 codes · 1 203 marques                       │
└─────────────────────────────────────────────────────────────┘
```

**Résultats :**
```
┌─────────────────────────────────────────────────────────────┐
│  🔍 "nordvpn"                                               │
├─────────────────────────────────────────────────────────────┤
│  NORDVPN                                                    │
│  ┌──────────────┐                                           │
│  │  NOWTECH20   │  📋  ← clic = copié                       │
│  └──────────────┘                                           │
│  trouvé il y a 2 jours · source: @Nowtech                   │
│                                                             │
│  ┌──────────────┐                                           │
│  │  LOKAN15     │  📋                                       │
│  └──────────────┘                                           │
│  trouvé il y a 5 jours · source: @Lokan                     │
└─────────────────────────────────────────────────────────────┘
```

**Principes UX :**
- 1 action = 1 clic (copie automatique)
- Info minimale : code, date relative, source
- Zéro compte utilisateur
- Mobile first
- Feedback immédiat "Copié !"

---

## Action Plan

### Phase 1 : Setup (Jour 1-2)
- [ ] Créer le repo GitHub (public)
- [ ] Setup GitHub Secrets (YOUTUBE_API_KEY, GEMINI_API_KEY)
- [ ] Créer structure de base (`/data`, `/src`, `/.github/workflows`, `/tests`)
- [ ] Créer `.env.example` pour les forks

### Phase 2 : Scrapping (Jour 3-5)
- [ ] Script YouTube API : search.list FR + mots-clés + date
- [ ] Script d'extraction de descriptions (videos.list)
- [ ] Premiers tests manuels sur ~100 vidéos
- [ ] Identifier les mots-clés FR optimaux

### Phase 3 : Parsing (Jour 6-10)
- [ ] Premières regex basiques (patterns évidents)
- [ ] Intégration LLM (Gemini Flash) avec batching
- [ ] Prompt avec suggestion de regex
- [ ] Créer test dataset initial (~50 exemples)
- [ ] Script de validation regex contre test dataset

### Phase 4 : Frontend (Jour 11-14)
- [ ] HTML/CSS/JS minimal
- [ ] Intégration Fuse.js pour recherche fuzzy
- [ ] Copy-to-clipboard avec feedback
- [ ] Page stats.json
- [ ] Deploy Cloudflare Pages

### Phase 5 : Automatisation (Jour 15+)
- [ ] GitHub Action cron quotidien
- [ ] stats.json + observabilité
- [ ] Notifications Discord/Slack en cas d'erreur
- [ ] Auto-PR pour nouvelles regex suggérées

---

## Decisions Summary

| Aspect | Décision |
|--------|----------|
| **Source** | YouTube Data API |
| **Région** | France uniquement |
| **Scrapping** | 1x/jour, batch si rate limit |
| **Parsing** | Regex → LLM fallback (Gemini Flash) |
| **Auto-amélioration** | LLM propose regex → Auto-PR → merge manuel |
| **Stockage** | SQLite → JSON export |
| **Hosting** | Cloudflare Pages (gratuit) |
| **Cron** | GitHub Actions (gratuit) |
| **Recherche** | Par marque, fuzzy côté client (Fuse.js) |
| **UX** | Brutalist, 1 clic = copié |
| **Coût total** | **0€/mois** |

---

## Roadmap Future (Hors MVP)

- [ ] Liens affiliés (en plus des codes)
- [ ] Votes communautaires (👍/👎)
- [ ] Expiration intelligente basée sur les votes
- [ ] Extensions navigateur (Chrome, Firefox)
- [ ] Multi-pays (US, DE, UK...)
- [ ] Soumission communautaire de codes
- [ ] Comptes utilisateurs

---

## External References

| Référence | Insight |
|-----------|---------|
| **MeetSponsors** (meetsponsors.com) | Proof of concept que le parsing YouTube à grande échelle est faisable. Créé par @BenjaminCode. |
| **Sites concurrents** | radins.com, lareduction.fr — exemples de ce qu'on veut éviter (pubs, partenariats) |

---

## Session Insights

**Breakthrough moments :**
1. Pivot vers recherche par marque (pas par site) — simplifie énormément le MVP
2. Architecture Zero Backend — coût littéralement 0€
3. Système auto-améliorant (LLM → regex → Auto-PR) — coûts décroissants avec le temps

**Creative approach :**
- First Principles a permis de valider les hypothèses avec des données réelles
- Resource Constraints a forcé une architecture ultra-minimaliste
- Question Storming a identifié les risques (quotas, sécurité) avant qu'ils ne deviennent des problèmes

---

*Session completed: 2026-01-18*
*Techniques: First Principles Thinking, Resource Constraints, Question Storming*
*Ideas generated: 13*
*Workflow: AI-Recommended*
