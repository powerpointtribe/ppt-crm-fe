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
import { Calendar } from '../ui/Calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { CalendarIcon, Search, Download, Eye, Filter } from 'lucide-react';
import { auditLogService } from '../../services/auditLogService';
import { AuditLog, AuditLogQuery, AuditAction, AuditEntity } from '../../types/audit';
import { cn } from '../../utils/cn';

const AuditLogList: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    count: 0,
    total: 0,
  });

  const [filters, setFilters] = useState<AuditLogQuery>({
    page: 1,
    limit: 20,
    sortBy: 'timestamp',
    sortOrder: 'desc',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const queryParams: AuditLogQuery = {
        ...filters,
        search: searchTerm || undefined,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        action: selectedAction as AuditAction || undefined,
        entityType: selectedEntity as AuditEntity || undefined,
        severity: selectedSeverity as 'low' | 'medium' | 'high' | 'critical' || undefined,
      };

      const response = await auditLogService.getAuditLogs(queryParams);
      setAuditLogs(response.auditLogs);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [filters]);

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
    fetchAuditLogs();
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'bg-green-100 text-green-800';
    if (action.includes('UPDATE')) return 'bg-blue-100 text-blue-800';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-800';
    if (action.includes('VIEW')) return 'bg-gray-100 text-gray-800';
    return 'bg-purple-100 text-purple-800';
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const queryParams: AuditLogQuery = {
        search: searchTerm || undefined,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        action: selectedAction as AuditAction || undefined,
        entityType: selectedEntity as AuditEntity || undefined,
        severity: selectedSeverity as 'low' | 'medium' | 'high' | 'critical' || undefined,
      };

      const data = await auditLogService.exportLogs(queryParams, format);

      const blob = new Blob([format === 'csv' ? data : JSON.stringify(data, null, 2)], {
        type: format === 'csv' ? 'text/csv' : 'application/json',
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting audit logs:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Audit Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search audit logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>

              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Actions</SelectItem>
                  {Object.values(AuditAction).map((action) => (
                    <SelectItem key={action} value={action}>
                      {action.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by entity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Entities</SelectItem>
                  {Object.values(AuditEntity).map((entity) => (
                    <SelectItem key={entity} value={entity}>
                      {entity.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Severities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-xs sm:text-sm font-medium">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full sm:w-[240px] justify-start text-left font-normal text-sm',
                        !startDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{startDate ? format(startDate, 'PPP') : 'Pick start date'}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-xs sm:text-sm font-medium">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full sm:w-[240px] justify-start text-left font-normal text-sm',
                        !endDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{endDate ? format(endDate, 'PPP') : 'Pick end date'}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSearch} className="flex items-center gap-2 flex-1 sm:flex-none justify-center text-sm">
                <Filter className="h-4 w-4" />
                Apply Filters
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport('csv')}
                className="flex items-center gap-2 text-sm"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span> CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport('json')}
                className="flex items-center gap-2 text-sm"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span> JSON
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs - Mobile Card View */}
      <Card className="md:hidden">
        <CardContent className="p-3">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading audit logs...</div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No audit logs found</div>
          ) : (
            <div className="space-y-3">
              {/* Mobile Pagination - Top */}
              {pagination.pages > 1 && (
                <div className="flex flex-col gap-2 pb-3 border-b border-gray-200">
                  <div className="text-sm text-gray-500 text-center">
                    Showing {pagination.count} of {pagination.total} results
                  </div>
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.current - 1)}
                      disabled={pagination.current === 1}
                    >
                      Previous
                    </Button>
                    <span className="px-3 py-1 text-sm flex items-center">
                      {pagination.current} / {pagination.pages}
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

              {auditLogs.map((log) => (
                <div
                  key={log._id}
                  className="bg-white border border-gray-100 rounded-xl p-4 space-y-3 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1),0_1px_3px_-1px_rgba(0,0,0,0.06)]"
                >
                  {/* Header: Action and Severity */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`${getActionColor(log.action)} text-xs`}>
                        {log.action.replace(/_/g, ' ')}
                      </Badge>
                      <Badge className={`${getSeverityColor(log.severity)} text-xs`}>
                        {log.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {log.entityType.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  {/* Timestamp */}
                  <div className="text-xs text-gray-500 font-mono">
                    {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                  </div>

                  {/* Performed By */}
                  <div className="text-sm pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-400 uppercase">Performed By</span>
                    <div className="font-medium text-gray-900">{log.performedByName}</div>
                    <div className="text-xs text-gray-500">{log.performedByEmail}</div>
                  </div>

                  {/* Description */}
                  {log.description && (
                    <div className="text-sm pt-2 border-t border-gray-100">
                      <span className="text-xs text-gray-400 uppercase">Description</span>
                      <p className="text-gray-700 text-sm">{log.description}</p>
                    </div>
                  )}

                  {/* Unit */}
                  {(log.relatedUnit?.name || log.relatedDistrict?.name) && (
                    <div className="text-sm pt-2 border-t border-gray-100">
                      <span className="text-xs text-gray-400 uppercase">Related Unit</span>
                      <p className="text-gray-700">{log.relatedUnit?.name || log.relatedDistrict?.name}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Logs - Desktop Table View */}
      <Card className="hidden md:block">
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead className="hidden lg:table-cell">Performed By</TableHead>
                  <TableHead className="hidden xl:table-cell">Description</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead className="hidden lg:table-cell">Unit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading audit logs...
                    </TableCell>
                  </TableRow>
                ) : auditLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  auditLogs.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionColor(log.action)}>
                          {log.action.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {log.entityType.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div>
                          <div className="font-medium">{log.performedByName}</div>
                          <div className="text-sm text-gray-500">{log.performedByEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate hidden xl:table-cell">
                        {log.description || 'No description'}
                      </TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(log.severity)}>
                          {log.severity.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {log.relatedUnit?.name || log.relatedDistrict?.name || '-'}
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
                Showing {pagination.count} of {pagination.total} results
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

export default AuditLogList;