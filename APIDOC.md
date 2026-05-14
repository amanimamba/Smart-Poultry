# Smart Poultry Manager API Documentation

This document describes the API structure and data models for the Smart Poultry Manager application. 
Current status: **Prototype with Fake Data**. Implementation uses Axios for service calls.

## 1. Authentication

### POST `/api/auth/login`
- **Body**: `{ email, password }`
- **Response**: `User` object or 401.

### POST `/api/auth/register`
- **Body**: `{ name, email, password }`
- **Response**: `User` object.

## 2. Projects

### GET `/api/projects`
- **Response**: `Project[]`

### POST `/api/projects`
- **Body**: `Omit<Project, 'id'>`
- **Response**: `Project`

## 3. Daily Logs

### GET `/api/logs/:projectId`
- **Response**: `DailyLog[]`

### POST `/api/logs`
- **Body**: `Omit<DailyLog, 'id' | 'timestamp'>`
- **Response**: `DailyLog`

## 4. AI Diagnosis

### POST `/api/ai/diagnose`
- **Body**: `{ imageBase64 }`
- **Response**: 
```json
{
  "diseaseName": "Coccidiose",
  "confidence": 0.89,
  "severity": "high",
  "advice": "Isoler les sujets atteints et traiter l'eau.",
  "medications": ["Amprolium", "Vitamines K"]
}
```

## 5. Feed & Maintenance

### GET `/api/settings/feed-prices`
- **Response**: `FeedPriceConfig[]`

### PUT `/api/settings/feed-prices`
- **Body**: `FeedPriceConfig[]`

---

## Technical Configuration (src/services/api.ts)

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor for Auth
api.interceptors.request.use(config => {
  const user = localStorage.getItem('poultry_user');
  if (user) {
    const { token } = JSON.parse(user);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```
