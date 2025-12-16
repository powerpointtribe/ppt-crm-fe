import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/Table';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Plus, Search, Package, AlertTriangle, Calendar } from 'lucide-react';
import { inventoryService } from '../../services/inventoryService';
import {
  InventoryItem,
  InventoryQuery,
  InventoryStatus,
  UnitOfMeasurement,
  InventoryCategory,
} from '../../types/inventory';

const InventoryItemList: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    count: 0,
    total: 0,
  });

  const [filters, setFilters] = useState<InventoryQuery>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<string>('');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const queryParams: InventoryQuery = {
        ...filters,
        search: searchTerm || undefined,
        category: selectedCategory || undefined,
        status: selectedStatus as InventoryStatus || undefined,
        assignedUnit: selectedUnit || undefined,
      };

      const response = await inventoryService.getItems(queryParams);
      setItems(response.items);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching inventory items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const categoriesData = await inventoryService.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [filters]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
    fetchItems();
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const getStatusColor = (status: InventoryStatus) => {
    switch (status) {
      case InventoryStatus.ACTIVE: return 'bg-green-100 text-green-800';
      case InventoryStatus.INACTIVE: return 'bg-gray-100 text-gray-800';
      case InventoryStatus.DISCONTINUED: return 'bg-red-100 text-red-800';
      case InventoryStatus.OUT_OF_STOCK: return 'bg-orange-100 text-orange-800';
      case InventoryStatus.LOW_STOCK: return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStockStatusColor = (item: InventoryItem) => {
    if (item.currentStock <= 0) return 'text-red-600';
    if (item.currentStock <= item.reorderLevel) return 'text-yellow-600';
    return 'text-green-600';
  };

  const formatCurrency = (amount: number, currency: string = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Inventory Items
            </CardTitle>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  {Object.values(InventoryStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={handleSearch}>
                Search
              </Button>
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilters(prev => ({ ...prev, lowStock: true, page: 1 }));
                  fetchItems();
                }}
                className="flex items-center gap-1"
              >
                <AlertTriangle className="h-3 w-3" />
                Low Stock
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilters(prev => ({ ...prev, outOfStock: true, page: 1 }));
                  fetchItems();
                }}
                className="flex items-center gap-1"
              >
                <Package className="h-3 w-3" />
                Out of Stock
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilters(prev => ({ ...prev, nearExpiry: true, page: 1 }));
                  fetchItems();
                }}
                className="flex items-center gap-1"
              >
                <Calendar className="h-3 w-3" />
                Near Expiry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading items...
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No items found
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-500">
                            Code: {item.itemCode}
                          </div>
                          {item.brand && (
                            <div className="text-xs text-gray-400">
                              {item.brand} {item.model && `- ${item.model}`}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" style={{ backgroundColor: item.category.color }}>
                          {item.category.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className={getStockStatusColor(item)}>
                          <div className="font-medium">
                            {item.currentStock} {item.unitOfMeasurement.replace(/_/g, ' ').toLowerCase()}
                          </div>
                          {item.reorderLevel > 0 && (
                            <div className="text-xs">
                              Reorder: {item.reorderLevel}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(item.unitCost, item.currency)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(item.currentStock * item.unitCost, item.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          {item.assignedUnit?.name || item.assignedDistrict?.name || '-'}
                          {item.location && (
                            <div className="text-xs text-gray-500">{item.location}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Showing {pagination.count} of {pagination.total} items
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.current - 1)}
                  disabled={pagination.current === 1}
                >
                  Previous
                </Button>
                <span className="px-3 py-1 text-sm">
                  Page {pagination.current} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.current + 1)}
                  disabled={pagination.current === pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryItemList;