const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  databaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID ?? '(default)',
};

const FIRESTORE_BASE_URL = FIREBASE_CONFIG.projectId
  ? `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/${FIREBASE_CONFIG.databaseId}`
  : '';

const isConfigured = Boolean(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId);

type FirestoreValue = {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  nullValue?: null;
  timestampValue?: string;
  mapValue?: {
    fields?: Record<string, FirestoreValue>;
  };
  arrayValue?: {
    values?: FirestoreValue[];
  };
};

type FirestoreDocument = {
  name: string;
  fields?: Record<string, FirestoreValue>;
  createTime?: string;
  updateTime?: string;
};

type FirestoreQueryResult = {
  document?: FirestoreDocument;
};

const toFirestoreValue = (value: unknown): FirestoreValue => {
  if (value === null || typeof value === 'undefined') {
    return { nullValue: null };
  }

  if (typeof value === 'string') {
    return { stringValue: value };
  }

  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? { integerValue: value.toString() }
      : { doubleValue: value };
  }

  if (typeof value === 'boolean') {
    return { booleanValue: value };
  }

  if (value instanceof Date) {
    return { timestampValue: value.toISOString() };
  }

  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map(toFirestoreValue),
      },
    };
  }

  if (typeof value === 'object') {
    return {
      mapValue: {
        fields: toFirestoreFields(value as Record<string, unknown>),
      },
    };
  }

  return { stringValue: String(value) };
};

const toFirestoreFields = (data: Record<string, unknown>) => {
  const fields: Record<string, FirestoreValue> = {};

  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'undefined') return;
    fields[key] = toFirestoreValue(value);
  });

  return fields;
};

const fromFirestoreValue = (value?: FirestoreValue): unknown => {
  if (!value) return null;

  if (typeof value.stringValue !== 'undefined') {
    return value.stringValue;
  }

  if (typeof value.integerValue !== 'undefined') {
    return Number(value.integerValue);
  }

  if (typeof value.doubleValue !== 'undefined') {
    return value.doubleValue;
  }

  if (typeof value.booleanValue !== 'undefined') {
    return value.booleanValue;
  }

  if (typeof value.timestampValue !== 'undefined') {
    return value.timestampValue;
  }

  if (value.mapValue?.fields) {
    const result: Record<string, unknown> = {};
    for (const [key, innerValue] of Object.entries(value.mapValue.fields)) {
      result[key] = fromFirestoreValue(innerValue);
    }
    return result;
  }

  if (value.arrayValue?.values) {
    return value.arrayValue.values.map(fromFirestoreValue);
  }

  return null;
};

const fromFirestoreFields = (fields?: Record<string, FirestoreValue>) => {
  const result: Record<string, unknown> = {};
  if (!fields) return result;

  Object.entries(fields).forEach(([key, value]) => {
    result[key] = fromFirestoreValue(value);
  });

  return result;
};

const getDocumentId = (documentName: string) => documentName.split('/').pop() ?? documentName;

const authorizedFetch = async (url: string, options: RequestInit) => {
  if (!isConfigured) {
    throw new Error('Firebase não está configurado.');
  }

  const response = await fetch(`${url}?key=${FIREBASE_CONFIG.apiKey}`, {
    method: 'GET',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Erro na comunicação com o Firebase');
  }

  return response.json() as Promise<unknown>;
};

const createDocument = async (collection: string, data: Record<string, unknown>) => {
  const url = `${FIRESTORE_BASE_URL}/documents/${collection}`;
  const payload = {
    fields: toFirestoreFields(data),
  };

  const response = await authorizedFetch(url, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response as FirestoreDocument;
};

const runQuery = async (collection: string, field: string, value: unknown, limitDocuments?: number) => {
  const url = `${FIRESTORE_BASE_URL}/documents:runQuery`;

  const body = {
    structuredQuery: {
      from: [{ collectionId: collection }],
      where: {
        fieldFilter: {
          field: { fieldPath: field },
          op: 'EQUAL',
          value: toFirestoreValue(value),
        },
      },
      ...(limitDocuments ? { limit: limitDocuments } : {}),
    },
  };

  const response = await authorizedFetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return response as FirestoreQueryResult[];
};

const updateDocument = async (
  documentName: string,
  data: Record<string, unknown>,
  fieldsToUpdate: string[],
) => {
  const url = `https://firestore.googleapis.com/v1/${documentName}`;
  const params = new URLSearchParams();
  params.set('key', FIREBASE_CONFIG.apiKey);
  fieldsToUpdate.forEach(field => params.append('updateMask.fieldPaths', field));

  const response = await fetch(`${url}?${params.toString()}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields: toFirestoreFields(data) }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Erro ao atualizar documento no Firebase');
  }

  return response.json() as Promise<FirestoreDocument>;
};

const listDocuments = async (collection: string, filters: Array<{ field: string; value: unknown }>) => {
  const url = `${FIRESTORE_BASE_URL}/documents:runQuery`;

  const whereClause = filters.reduceRight((acc, filter) => {
    const filterClause = {
      fieldFilter: {
        field: { fieldPath: filter.field },
        op: 'EQUAL',
        value: toFirestoreValue(filter.value),
      },
    };

    if (!acc) return filterClause;

    return {
      compositeFilter: {
        op: 'AND',
        filters: [filterClause, acc],
      },
    };
  }, null as unknown);

  const body = {
    structuredQuery: {
      from: [{ collectionId: collection }],
      ...(whereClause ? { where: whereClause } : {}),
    },
  };

  const response = await authorizedFetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return response as FirestoreQueryResult[];
};

export type FirebasePlayerDocument = {
  id: string;
  documentName: string;
  fields: Record<string, unknown>;
};

export type FirebaseSessionDocument = {
  id: string;
  fields: Record<string, unknown>;
};

export const firebaseClient = {
  isConfigured,
  config: FIREBASE_CONFIG,
  async findPlayerByCode(code: string): Promise<FirebasePlayerDocument | null> {
    const results = await runQuery('players', 'code', code, 1);
    const document = results.find(result => result.document)?.document;
    if (!document) return null;

    return {
      id: getDocumentId(document.name),
      documentName: document.name,
      fields: fromFirestoreFields(document.fields),
    };
  },
  async createPlayer(data: Record<string, unknown>): Promise<FirebasePlayerDocument> {
    const document = await createDocument('players', data);
    return {
      id: getDocumentId(document.name),
      documentName: document.name,
      fields: fromFirestoreFields(document.fields),
    };
  },
  async updatePlayer(
    documentName: string,
    data: Record<string, unknown>,
    fields: string[],
  ): Promise<FirebasePlayerDocument> {
    const document = await updateDocument(documentName, data, fields);
    return {
      id: getDocumentId(document.name),
      documentName: document.name,
      fields: fromFirestoreFields(document.fields),
    };
  },
  async createSession(data: Record<string, unknown>): Promise<FirebaseSessionDocument> {
    const document = await createDocument('game_sessions', data);
    return {
      id: getDocumentId(document.name),
      fields: fromFirestoreFields(document.fields),
    };
  },
  async logCheckpoint(data: Record<string, unknown>) {
    await createDocument('checkpoints_progress', data);
  },
  async listCompletedSessions(): Promise<FirebaseSessionDocument[]> {
    const results = await listDocuments('game_sessions', [{ field: 'is_completed', value: true }]);
    return results
      .filter((result): result is FirestoreQueryResult & { document: FirestoreDocument } => Boolean(result.document))
      .map(result => ({
        id: getDocumentId(result.document.name),
        fields: fromFirestoreFields(result.document.fields),
      }));
  },
};
