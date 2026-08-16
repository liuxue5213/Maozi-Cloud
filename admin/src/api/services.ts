import request from './request';

export interface AppItem {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  type: 'APK' | 'WEB';
  category: string;
  status: 'online' | 'offline';
  created_at: string;
  updated_at: string;
  version_code?: number;
  version_name?: string;
  package_name?: string;
  apk_url?: string;
  file_size?: number;
  latest_changelog?: string;
  upload_time?: string;
  web_url?: string;
  display_mode?: string;
}

export interface AppDetail extends AppItem {
  versions: ApkVersion[];
  web_config: WebConfig | null;
}

export interface ApkVersion {
  id: string;
  app_id: string;
  version_code: number;
  version_name: string;
  package_name: string;
  apk_url: string;
  file_size: number;
  min_sdk: number;
  changelog: string;
  is_latest: number;
  upload_time: string;
}

export interface WebConfig {
  id: string;
  app_id: string;
  web_url: string;
  display_mode: string;
}

export interface UploadResponse {
  file_url: string;
  file_name: string;
  original_name: string;
  file_size: number;
}

// 认证
export const authApi = {
  login: (username: string, password: string) =>
    request.post('/auth/login', { username, password }),
  verify: () => request.get('/auth/verify'),
};

// 应用管理
export const appApi = {
  getList: () => request.get('/apps'),
  getDetail: (id: string) => request.get(`/apps/${id}`),
  create: (data: Partial<AppItem> & { web_url?: string; display_mode?: string }) =>
    request.post('/apps', data),
  update: (id: string, data: Partial<AppItem>) =>
    request.put(`/apps/${id}`, data),
  delete: (id: string) => request.delete(`/apps/${id}`),
  addVersion: (appId: string, data: Omit<ApkVersion, 'id' | 'app_id' | 'upload_time'>) =>
    request.post(`/apps/${appId}/versions`, data),
  deleteVersion: (appId: string, versionId: string) =>
    request.delete(`/apps/${appId}/versions/${versionId}`),
  setLatestVersion: (appId: string, versionId: string) =>
    request.patch(`/apps/${appId}/versions/${versionId}/set-latest`),
};

// 文件上传
export const fileApi = {
  uploadApk: (file: File, onProgress?: (percent: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    return request.post('/files/upload/apk', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total && onProgress) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    });
  },
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request.post('/files/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
