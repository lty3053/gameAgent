/**
 * 用户认证工具函数
 */

const USER_KEY_STORAGE = 'game_agent_user_key';
const USER_INFO_STORAGE = 'game_agent_user_info';

export const getUserKey = () => {
  return localStorage.getItem(USER_KEY_STORAGE);
};

export const setUserKey = (userKey) => {
  localStorage.setItem(USER_KEY_STORAGE, userKey);
};

export const getUserInfo = () => {
  const info = localStorage.getItem(USER_INFO_STORAGE);
  return info ? JSON.parse(info) : null;
};

export const setUserInfo = (userInfo) => {
  localStorage.setItem(USER_INFO_STORAGE, JSON.stringify(userInfo));
};

export const clearAuth = () => {
  localStorage.removeItem(USER_KEY_STORAGE);
  localStorage.removeItem(USER_INFO_STORAGE);
};

export const isAuthenticated = () => {
  return !!getUserKey();
};
