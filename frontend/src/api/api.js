import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Chat API
export const sendMessage = async (message, userKey) => {
  const response = await api.post('/chat/message', {
    message,
    user_key: userKey,
  });
  return response.data;
};

// 用户认证 API
export const createGuest = async () => {
  const response = await api.post('/auth/guest');
  return response.data;
};

export const register = async (email, password) => {
  const response = await api.post('/auth/register', { email, password });
  return response.data;
};

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const verifyUser = async (userKey) => {
  const response = await api.post('/auth/verify', { user_key: userKey });
  return response.data;
};

// 对话历史 API
export const getChatHistory = async (userKey) => {
  const response = await api.get(`/chat/history/${userKey}`);
  return response.data;
};

export const clearChatHistory = async (userKey) => {
  const response = await api.delete(`/chat/history/${userKey}`);
  return response.data;
};

// Game API
export const getGames = async () => {
  const response = await api.get('/games');
  return response.data;
};

export const getGameById = async (id) => {
  const response = await api.get(`/games/${id}`);
  return response.data;
};

export const searchGames = async (query) => {
  const response = await api.get('/games/search', {
    params: { q: query },
  });
  return response.data;
};

// Upload API - 后端上传到 S3（不再使用前端直传）
export const uploadFile = async (file, onProgress, gameInfo = {}, uploadId) => {
  try {
    console.log('Starting backend upload...', { fileName: file.name, size: file.size });
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', gameInfo.name || file.name);
    if (gameInfo.description) formData.append('description', gameInfo.description);
    if (gameInfo.coverImage) formData.append('cover_image', gameInfo.coverImage);
    formData.append('upload_id', uploadId);
    
    const response = await api.post('/upload/file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 3600000, // 1 hour for large files
      onUploadProgress: (progressEvent) => {
        // 这个只是上传到后端服务器的进度（通常很快，不到1秒）
        // 实际 S3 上传进度通过 WebSocket 推送
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          // 只在前5%显示（表示文件已发送到后端）
          onProgress(Math.min(percentCompleted * 0.05, 5));
        }
      },
    });
    
    console.log('Upload complete:', response.data);
    return response.data;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};

export const getUploadProgress = async (uploadId) => {
  try {
    const response = await api.get(`/upload/progress/${uploadId}`);
    return response.data;
  } catch (error) {
    console.error('Get progress failed:', error);
    return null;
  }
};

// 网盘链接上传
export const uploadNetdisk = async (netdiskData, uploadId) => {
  try {
    console.log('Saving netdisk link...', netdiskData);
    
    const formData = new FormData();
    formData.append('name', netdiskData.name);
    if (netdiskData.description) formData.append('description', netdiskData.description);
    formData.append('netdisk_url', netdiskData.netdisk_url);
    formData.append('netdisk_type', netdiskData.netdisk_type);
    if (netdiskData.file_size) formData.append('file_size', netdiskData.file_size);
    if (netdiskData.coverImage) formData.append('cover_image', netdiskData.coverImage);
    formData.append('upload_id', uploadId);
    
    const response = await api.post('/upload/netdisk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('Netdisk link saved:', response.data);
    return response.data;
  } catch (error) {
    console.error('Save netdisk link failed:', error);
    throw error;
  }
};

export const uploadImage = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  });

  return response.data;
};

export const uploadVideo = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/upload/video', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 3600000, // 1 hour for large videos
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  });

  return response.data;
};

export default api;
