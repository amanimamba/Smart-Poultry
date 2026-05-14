# Documentation API de Smart Poultry (IA Avicole)

Cette documentation décrit les structures de données et les points de terminaison suggérés pour alimenter l'application Smart Poultry. L'application utilise **Axios** pour les requêtes HTTP.

## 1. Configuration Client (Axios)

Le client est configuré dans `src/lib/api.ts`. Il inclut :
- Gestion des tokens d'authentification (Intercepteurs).
- Gestion centralisée des erreurs.
- BaseURL configurable via variables d'environnement.

## 2. Modèles de Données Principaux

### Projets d'Élevage (`Project`)
Gère les cycles de production des poulets.

| Champ | Type | Description |
| :--- | :--- | :--- |
| `id` | `string (ID)` | Identifiant unique du projet |
| `name` | `string` | Nom du projet (ex: "Bande Mai 2024") |
| `type` | `enum` | `'Ponte'`, `'Chair'`, `'Mixte'` |
| `chickCount` | `number` | Nombre initial de sujets |
| `startDate` | `ISO Date` | Date de début de l'élevage |
| `breed` | `string` | Race (ex: "ISA Brown", "Cobb 500") |
| `status` | `enum` | `'active'`, `'completed'` |

### Journaux de Santé & Poids (`HealthLog`)
| Champ | Type | Description |
| :--- | :--- | :--- |
| `projectId` | `string (ID)` | Référence au projet |
| `deadBirds` | `number` | Nombre de décès |
| `sickBirds` | `number` | Nombre de malades |
| `averageWeight` | `number` | Poids moyen en grammes |
| `symptoms` | `string` | Observations textuelles |

---

## 3. Sécurité & Clés API (Gemini)

L'application utilise l'IA pour le diagnostic. Pour des raisons de sécurité, la clé API ne doit jamais être exposée côté client en production.

| Variable | Source | Utilisation |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | `.env` | Clé d'authentification pour Google Generative AI |

**Implémentation :**
L'application utilise `process.env.GEMINI_API_KEY` (configuré dans l'environnement de build/serveur) pour initialiser le SDK `@google/generative-ai`.

---

## 4. Endpoints API Complexes (REST)

### Authentification
- `POST /auth/login` : Authentification utilisateur.
- `POST /auth/register` : Création de compte ferme/éleveur.

### Gestion des Cycles
- `GET /projects` : Récupère tous les lots d'élevage.
- `GET /projects/:id/analytics` : Données complexes (FCR - Feed Conversion Ratio, Taux de croissance réel vs théorique).
- `PATCH /projects/:id/close` : Clôturer un lot (calcul de rentabilité finale).

### Monitoring Avancé
- `GET /analytics/feed-efficiency` : Analyse de l'efficacité alimentaire globale.
- `POST /inventory/orders` : Commande automatique d'aliment auprès des fournisseurs basés sur la consommation réelle.

### Intégration IoT (Optionnel)
- `GET /sensors/hatch-temp` : Température et humidité en temps réel du bâtiment.

---

## 4. Intégration IA (Gemini)

L'application utilise le modèle **Gemini 1.5 Flash** pour le diagnostic. 
**Format de requête recommandé :**
- `POST /ai/diagnose` (Proxy vers Gemini pour sécurité des clés) :
```json
{
  "image": "base64_data",
  "history": ["historique_symptomes_7_derniers_jours"]
}
```

---

## 5. Exemple d'utilisation avec Axios dans le code

```ts
import api from './lib/api';

const saveHealthData = async (data) => {
  try {
    const response = await api.post('/logs/health', data);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de l'enregistrement", error);
  }
};
```
