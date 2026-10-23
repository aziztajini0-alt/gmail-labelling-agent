# gmail-labelling-agent

> _Étiquetage automatique des emails entrants sur Gmail grâce à Google Gemini. Un workflow n8n défini en TypeScript avec le [Workflow SDK](https://docs.n8n.io/integrations/guides/workflow-sdk)._

---

## 📋 Table des matières

- [À propos](#-à-propos)
- [Fonctionnement](#-fonctionnement)
- [Installation et configuration](#-installation-et-configuration)
- [Sécurité et vie privée](#-sécurité-et-vie-privée)
- [Structure du projet](#-structure-du-projet)
- [Contribuer](#-contribuer)
- [Références](#-références)

---

## 🎯 À propos

`gmail-labelling-agent` classe automatiquement chaque email entrant dans le label Gmail le plus pertinent. Piloté par un agent IA basé sur **Google Gemini**, il analyse le message (expéditeur, destinataire, sujet, mots-clés, contenu), consulte la liste de vos labels existants et réutilise le label le plus proche. S'il n'en convient aucun, il en crée un nouveau en respectant la structure de votre arborescence : sous-labels, préfixes, capitalisation. Les emails peu importants — publicités, promotions — sont retirés de la boîte de réception.

**Principales fonctionnalités :**

- **Classification automatique** : un nouvel email est détecté toutes les 5 minutes grâce au trigger Gmail.
- **Réutilisation des labels existants** : l'agent privilégie toujours les catégories déjà créées.
- **Création intelligente de labels** : un label n'est créé que s'il n'existe aucun label adapté ; il devient alors un sous-label d'un label parent, ou est rattaché à un label « AI » s'il n'y en a aucun.
- **Nettoyage de la boîte** : le label « Boîte de réception » est retiré pour les mails publicitaires ou promotionnels (type « Reclame »).

---

## 📚 Fonctionnement

Le pipeline suit quatre étapes : détection d'un nouvel email, attente, décision de l'agent IA, puis application (ou création) du label.

```mermaid
flowchart TB
    accTitle: Circuit de labellisation automatique des emails
    accDescr: Chaque email entrant est analysé par un agent IA (Google Gemini) qui lui affecte le label le plus approprié, en réutilisant ou en complétant la structure des labels existants

    inbox([📩 Email entrant]) --> trig[⏱ Trigger Gmail — contrôle toutes les 5 min]
    trig --> wait[⏳ Wait — délai de 1 min]
    wait --> agent["🤖 Agent IA (Gemini, max 5 itérations)
    outils : lire le message, lister, créer, appliquer un label"]
    agent --> check{🏷 Label existant et approprié ?}
    check -->|Oui| apply[🏷 Appliquer le label]
    check -->|Non| create[➕ Créer un label (sous-label)]
    create --> apply
    apply --> done([✅ Email classé])
```

**Composants du workflow** (source : `gmail-labelling-agent.ts`) :

| Composant | Rôle | Détail technique |
| --- | --- | --- |
| Gmail Trigger | Déclencheur | `n8n-nodes-base.gmailTrigger` v1.2 — interroge Gmail toutes les 5 min |
| Wait node | Délai | 1 minute avant traitement |
| Agent IA | Prise de décision | Nœud LangChain agent v1.7, max 5 itérations, `onError: continueErrorOutput` |
| Modèle Gemini | Raisonnement | `gemini-flash-lite-latest` via `lmChatGoogleGemini` v1.2 |
| Mémoire | Contexte | Window buffer indexé par l'ID du message |
| Outils Gmail | Actions | 4 fonctions API : lire le message, lister les labels, créer un label, l'appliquer |

**Comportement de l'agent** (consigne intégrée au workflow) :

1. Analyse le sujet, l'expéditeur, les destinataires, les mots-clés et le contenu de l'email.
2. Compare avec les labels existants et applique le plus pertinent — par exemple, « Project Alpha Update » est classé sous **[Project Alpha]** s'il existe.
3. S'il n'y a pas de label adapté, il en crée un (par exemple **Vendor Inquiry** pour « New Vendor Inquiry »), en sous-label d'un parent existant, ou sous le label **AI** s'il n'y en a pas, en respectant la casse, les délimiteurs et les préfixes.
4. Pour un mail jugé peu important (publicité, promotion) : le label **Boîte de réception** est retiré.

---

## ⚙️ Installation et configuration

### Prérequis

| Besoin | Détail |
| --- | --- |
| Instance n8n (auto-hébergée ou cloud) | Exécute le workflow et héberge les identifiants |
| Compte Google | Authentification Gmail via OAuth2 |
| Clé API Google AI | Accès au modèle Gemini — obtenue sur [AI Studio](https://aistudio.google.com/app/apikey) |

Node.js et npm ne sont suivis que si vous modifiez localement le fichier TypeScript.

### Installation

```bash
git clone https://github.com/aziztajini0-alt/gmail-labelling-agent.git
cd gmail-labelling-agent
```

1. **Intégrez le workflow dans n8n.** Le fichier `gmail-labelling-agent.ts` est une définition standard du [Workflow SDK](https://docs.n8n.io/integrations/guides/workflow-sdk) : importez-la directement avec `n8n-cli` (qui supporte les fichiers TypeScript) ou convertissez-la en JSON (`parseWorkflowCode()` puis `toJSON()`) avant l'import dans l'interface n8n.
2. **Créez les deux identifiants** listés ci-dessous dans n8n et liez-les aux noms « placeholder » du code — aucun secret ne doit jamais y figurer.
3. **Activez le workflow** : le trigger traite alors un email toutes les 5 minutes, en continu.

### Identifiants requis (credentials n8n)

| Credential | Nom dans le code | Accès requis |
| --- | --- | --- |
| `gmailOAuth2` | « Gmail account » (outils) et « Gmail account 2 » (trigger) | Lecture/écriture sur Gmail via OAuth2 |
| `googlePalmApi` | « Google Gemini (PaLM) Api account » | Clé API Google AI — modèle Gemini |

> 💡 **Vérification** : envoyez-vous un email de test. Sous une dizaine de minutes (1 min de délai + jusqu'à 5 min de polling), l'email doit se voir attribuer le bon label dans Gmail.

---

## 🔐 Sécurité et vie privée

- **Aucun secret dans le code** : les identifiants n8n (OAuth2, clé API) sont enregistrés côté instance, jamais dans le dépôt.
- **Périmètre Gmail** : le token OAuth2 donne accès au contenu des messages et à la gestion des labels — ne le partagez pas.
- **Données envoyées à Google** : le contenu des emails transite par l'API Gemini, conformément aux conditions d'utilisation de Google AI.
- Le workflow s'exécute sous **votre propre compte** Google, dans votre instance n8n.

---

## 🔧 Structure du projet

```text
gmail-labelling-agent/
├── gmail-labelling-agent.ts   # Définition du workflow (export n8n Workflow SDK)
└── skills/                    # Collection de skills OpenChambers — a son propre README
    ├── interview/             # Recueil interactif des besoins (une question à la fois)
    ├── doubt-driven-dev/      # Audit technique sceptique (hypothèses, cas limites)
    └── hostile-review/        # Revue "Red Team" inflexible (sécurité, performance)
```

---

## 🤝 Contribuer

- Restez sur la forme **Workflow SDK** : un fichier `.ts` se terminant par `export default workflow(...)`.
- Validez la définition avant toute soumission : la méthode `validate()` du SDK signale une structure invalide (paramètres erronés, identifiants manquants).
- Ouvrez une issue ou une pull request pour toute piste d'amélioration (autres modèles, support multilingue, gestion des attachments…).

---

## 🔗 Références

- [n8n Workflow SDK — documentation officielle](https://docs.n8n.io/integrations/guides/workflow-sdk)
- [Nœud Google Gemini (LangChain) — docs n8n](https://docs.n8n.io/integrations/builtin/cluster-nodes/n8n-nodes-langchain.lmchatgooglegemini)
- [Clés API Google AI Studio](https://aistudio.google.com/app/apikey)
- [Authentification OAuth 2.0 Google](https://developers.google.com/identity/protocols/oauth2)

---

*Dépôt public — [signaler un problème](https://github.com/aziztajini0-alt/gmail-labelling-agent/issues) ou ouvrir une discussion.*
