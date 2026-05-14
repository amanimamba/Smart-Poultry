import api from '../lib/api';
import { Project } from '../types';

/**
 * Service to handle data fetching via Axios
 * In a real app, these points to your backend.
 */
export const fetchProjects = async (): Promise<Project[]> => {
  try {
    // Faking a real API call
    console.log('Fetching projects from API...');
    const response = await api.get('/projects');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    // Return empty list if failed in this demo
    return [];
  }
};

export const saveDailyLog = async (logData: any) => {
  try {
    const response = await api.post('/logs', logData);
    return response.data;
  } catch (error) {
    console.error('Failed to save log:', error);
    throw error;
  }
};
