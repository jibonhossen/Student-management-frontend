const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_PREFIX = '/api/v1';
const API_GET_PREFIX = `${API_PREFIX}/get`;
const API_POST_PREFIX = `${API_PREFIX}/post`;

export class ApiError extends Error {
  constructor(message, { status, details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

const defaultHeaders = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

const buildUrl = (path, query) => {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  if (!query || typeof query !== 'object') return url;

  const searchParams = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      value.forEach(item => searchParams.append(key, item));
    } else {
      searchParams.set(key, value);
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${url}?${queryString}` : url;
};

const parsePayload = async response => {
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    const text = await response.text();
    return text ? { message: text } : {};
  }

  try {
    return await response.json();
  } catch (error) {
    throw new ApiError('Unable to parse server response', {
      status: response.status,
      details: { cause: error },
    });
  }
};

const request = async (path, { method = 'GET', body, headers, query, signal } = {}) => {
  const url = buildUrl(path, query);

  const init = {
    method,
    headers: { ...defaultHeaders, ...headers },
    signal,
  };

  if (body !== undefined) {
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const response = await fetch(url, init);
  const payload = await parsePayload(response);

  const isError =
    !response.ok ||
    (payload &&
      typeof payload === 'object' &&
      'success' in payload &&
      payload.success === false);

  if (isError) {
    const message =
      (payload && typeof payload === 'object' && payload.message) ||
      response.statusText ||
      'Something went wrong';

    throw new ApiError(message, {
      status: response.status,
      details: payload,
    });
  }

  return payload;
};

export const apiClient = {
  get: (path, options = {}) => request(path, { ...options, method: 'GET' }),
  post: (path, options = {}) => request(path, { ...options, method: 'POST' }),
  put: (path, options = {}) => request(path, { ...options, method: 'PUT' }),
  patch: (path, options = {}) => request(path, { ...options, method: 'PATCH' }),
  delete: (path, options = {}) => request(path, { ...options, method: 'DELETE' }),
};

export const withMessage = payload => ({
  data: payload?.data ?? null,
  message: payload?.message ?? '',
  success:
    payload?.success ??
    (payload && typeof payload === 'object' && !Array.isArray(payload)),
  raw: payload,
});

export const endpoints = {
  classes: {
    list: `${API_GET_PREFIX}/all-classes`,
    create: `${API_POST_PREFIX}/add-class`,
    update: `${API_POST_PREFIX}/update-class`,
  },
  subjects: {
    list: `${API_GET_PREFIX}/subjects-of-a-class`,
    create: `${API_POST_PREFIX}/add-subject`,
  },
  teachers: {
    list: `${API_GET_PREFIX}/all-teachers`,
    create: `${API_POST_PREFIX}/add-teacher`,
  },
  students: {
    listAll: `${API_GET_PREFIX}/all-students`,
    listByClass: classId =>
      `${API_GET_PREFIX}/all-students-of-a-class?class_id=${encodeURIComponent(classId)}`,
    create: `${API_POST_PREFIX}/add-student`,
  },
  exams: {
    list: `${API_GET_PREFIX}/exams-of-a-class`,
    create: `${API_POST_PREFIX}/add-exam`,
  },
  assignments: {
    create: `${API_POST_PREFIX}/add-teacher-assignment`,
  },
  teacher: {
    login: `/api/v1/mobile/login`,
    classes: `${API_GET_PREFIX}/catt`,
    subjects: `${API_GET_PREFIX}/soat`,
    students: `${API_GET_PREFIX}/students-of-a-class`,
  },
  results: {
    upsert: `${API_POST_PREFIX}/add-result`,
    public: `${API_GET_PREFIX}/results-of-a-student`,
  },
  debug: {
    data: `${API_GET_PREFIX}/all-management-data`,
  },
};

export default apiClient;

