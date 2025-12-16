import axios from 'axios';
import {
  InventoryItem,
  InventoryCategory,
  InventoryQuery,
  InventoryStatistics,
  CreateInventoryItemDto,
} from '../types/inventory';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const inventoryService = {
  // Categories
  async getCategories(): Promise<InventoryCategory[]> {
    const response = await axios.get(`${API_BASE_URL}/inventory/categories`);
    return response.data;
  },

  async getCategoryHierarchy(): Promise<InventoryCategory[]> {
    const response = await axios.get(`${API_BASE_URL}/inventory/categories/hierarchy`);
    return response.data;
  },

  async createCategory(data: Partial<InventoryCategory>): Promise<InventoryCategory> {
    const response = await axios.post(`${API_BASE_URL}/inventory/categories`, data);
    return response.data;
  },

  async updateCategory(id: string, data: Partial<InventoryCategory>): Promise<InventoryCategory> {
    const response = await axios.patch(`${API_BASE_URL}/inventory/categories/${id}`, data);
    return response.data;
  },

  async deleteCategory(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/inventory/categories/${id}`);
  },

  // Items
  async getItems(params: InventoryQuery) {
    const response = await axios.get(`${API_BASE_URL}/inventory/items`, { params });
    return response.data;
  },

  async getItem(id: string): Promise<InventoryItem> {
    const response = await axios.get(`${API_BASE_URL}/inventory/items/${id}`);
    return response.data;
  },

  async createItem(data: CreateInventoryItemDto): Promise<InventoryItem> {
    const response = await axios.post(`${API_BASE_URL}/inventory/items`, data);
    return response.data;
  },

  async updateItem(id: string, data: Partial<CreateInventoryItemDto>): Promise<InventoryItem> {
    const response = await axios.patch(`${API_BASE_URL}/inventory/items/${id}`, data);
    return response.data;
  },

  async deleteItem(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/inventory/items/${id}`);
  },

  async getStatistics(): Promise<InventoryStatistics> {
    const response = await axios.get(`${API_BASE_URL}/inventory/items/statistics`);
    return response.data;
  },

  async getLowStockItems(): Promise<InventoryItem[]> {
    const response = await axios.get(`${API_BASE_URL}/inventory/items/low-stock`);
    return response.data;
  },

  async getExpiringItems(days: number = 30): Promise<InventoryItem[]> {
    const response = await axios.get(`${API_BASE_URL}/inventory/items/expiring`, {
      params: { days },
    });
    return response.data;
  },
};