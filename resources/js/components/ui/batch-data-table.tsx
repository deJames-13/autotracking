import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import {
    Search,
    Filter,
    Download,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    RotateCcw,
    FileSpreadsheet,
    FileText,
    File,
    Trash2,
    AlertTriangle
} from 'lucide-react';
import { format as formatDate } from 'date-fns';
import { cn } from '@/lib/utils';
import { DateRangePicker } from 'react-date-range';
import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file
import { toast } from 'react-hot-toast';

export interface DataTableColumn<T = any> {
    key: string;
    label: string;
    sortable?: boolean;
    filterable?: boolean;
    render?: (value: any, row: T) => React.ReactNode;
    width?: string;
}

export interface DataTableFilter {
    key: string;
    label: string;
    type: 'text' | 'select' | 'date-range';
    options?: { value: string; label: string }[];
    placeholder?: string;
}

export interface DataTableExport {
    label: string;
    format: 'xlsx' | 'csv' | 'pdf';
}

export interface DataTableProps<T = any> {
    data: T[];
    columns: DataTableColumn<T>[];
    loading?: boolean;
    searchable?: boolean;
    filterable?: boolean;
    filters?: DataTableFilter[];
    exportable?: boolean;
    exports?: DataTableExport[];
    batchDelete?: boolean;
    pagination?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    onSearch?: (search: string) => void;
    onFilter?: (filters: Record<string, any>) => void;
    onSort?: (column: string, direction: 'asc' | 'desc') => void;
    onPageChange?: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;
    onExport?: (format: string, filters: Record<string, any>) => void;
    onBatchDelete?: (ids: any[], force?: boolean) => Promise<void>;
    className?: string;
    emptyMessage?: string;
    searchDebounceMs?: number;
    rowKey?: string; // Key field for unique row identification
    entityName?: string; // Name of the entity for batch delete confirmation
}

export function BatchDataTable<T = any>({
    data,
    columns,
    loading = false,
    searchable = true,
    filterable = true,
    filters = [],
    exportable = false,
    exports = [],
    batchDelete = false,
    pagination,
    onSearch,
    onFilter,
    onSort,
    onPageChange,
    onPerPageChange,
    onExport,
    onBatchDelete,
    className,
    emptyMessage = "No data available",
    searchDebounceMs = 500,
    rowKey = 'id', // Default to 'id' field
    entityName = 'items',
}: DataTableProps<T>) {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
    const [sortColumn, setSortColumn] = useState<string>('');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedRows, setSelectedRows] = useState<Set<any>>(new Set());
    const [isAllSelected, setIsAllSelected] = useState(false);
    const [showBatchDeleteDialog, setShowBatchDeleteDialog] = useState(false);
    const [batchDeleteLoading, setBatchDeleteLoading] = useState(false);
    const [dateRange, setDateRange] = useState<{
        startDate: Date | null;
        endDate: Date | null;
        key: string;
    }>({
        startDate: null,
        endDate: null,
        key: 'selection'
    });
    const isFirstRender = useRef(true);

    // Handle select all
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allIds = new Set(data.map(row => row[rowKey]));
            setSelectedRows(allIds);
            setIsAllSelected(true);
        } else {
            setSelectedRows(new Set());
            setIsAllSelected(false);
        }
    };

    // Handle individual row selection
    const handleRowSelect = (rowId: any, checked: boolean) => {
        const newSelected = new Set(selectedRows);
        if (checked) {
            newSelected.add(rowId);
        } else {
            newSelected.delete(rowId);
            setIsAllSelected(false);
        }
        setSelectedRows(newSelected);
    };

    // Update isAllSelected when selectedRows changes
    useEffect(() => {
        if (data.length > 0) {
            const allIds = data.map(row => row[rowKey]);
            const allSelected = allIds.every(id => selectedRows.has(id));
            setIsAllSelected(allSelected && selectedRows.size > 0);
        }
    }, [selectedRows, data, rowKey]);

    // Clear selections when data changes (e.g., pagination)
    useEffect(() => {
        setSelectedRows(new Set());
        setIsAllSelected(false);
    }, [pagination?.current_page]);

    // Debounced search with better dependency management
    useEffect(() => {
        if (!onSearch || isFirstRender.current) return;

        const timer = setTimeout(() => {
            onSearch(searchTerm);
        }, searchDebounceMs);

        return () => clearTimeout(timer);
    }, [searchTerm, searchDebounceMs]); // Removed onSearch from dependencies

    // Handle filter changes with useCallback to prevent infinite loops
    const handleFilterUpdate = useMemo(() => {
        // Filter out "all" values from activeFilters
        const cleanFilters = Object.entries(activeFilters).reduce((acc, [key, value]) => {
            if (value !== 'all' && value !== '') {
                acc[key] = value;
            }
            return acc;
        }, {} as Record<string, any>);

        const filterData = { ...cleanFilters };
        if (dateRange?.startDate && dateRange?.endDate) {
            filterData.date_from = formatDate(dateRange.startDate, 'yyyy-MM-dd');
            filterData.date_to = formatDate(dateRange.endDate, 'yyyy-MM-dd');
        }
        return filterData;
    }, [activeFilters, dateRange]);

    useEffect(() => {
        // Only call onFilter if we have meaningful filters (excluding "all" values)
        const hasMeaningfulFilters = Object.values(activeFilters).some(value => value !== 'all' && value !== '');
        const hasDateRange = dateRange?.startDate && dateRange?.endDate &&
            (dateRange.startDate.getTime() !== dateRange.endDate.getTime());

        if (onFilter && !isFirstRender.current && (hasMeaningfulFilters || hasDateRange)) {
            onFilter(handleFilterUpdate);
        }
        isFirstRender.current = false;
    }, [handleFilterUpdate, onFilter]);

    const handleSort = (column: string) => {
        const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortColumn(column);
        setSortDirection(newDirection);
        if (onSort) {
            onSort(column, newDirection);
        }
    };

    const handleFilterChange = (key: string, value: any) => {
        setActiveFilters(prev => {
            const newFilters = { ...prev };
            // Remove filter if value is "all" or empty
            if (value === 'all' || value === '') {
                delete newFilters[key];
            } else {
                newFilters[key] = value;
            }
            return newFilters;
        });
    };

    const clearFilters = () => {
        // Reset select filters to "all" instead of empty
        const resetFilters = filters.reduce((acc, filter) => {
            if (filter.type === 'select') {
                acc[filter.key] = 'all';
            }
            return acc;
        }, {} as Record<string, any>);

        setActiveFilters(resetFilters);
        setDateRange({
            startDate: null,
            endDate: null,
            key: 'selection'
        });
        setSearchTerm('');
    };

    const handleExport = (exportFormat: string, printAll?: boolean) => {
        if (onExport) {
            // Filter out "all" values from activeFilters
            const cleanFilters = Object.entries(activeFilters).reduce((acc, [key, value]) => {
                if (value !== 'all' && value !== '') {
                    acc[key] = value;
                }
                return acc;
            }, {} as Record<string, any>);

            const exportFilters = {
                search: searchTerm,
                ...cleanFilters,
                ...(dateRange?.startDate && { date_from: formatDate(dateRange.startDate, 'yyyy-MM-dd') }),
                ...(dateRange?.endDate && { date_to: formatDate(dateRange.endDate, 'yyyy-MM-dd') }),
                ...(printAll && { print_all: true }),
            };
            onExport(exportFormat, exportFilters);
        }
    };

    const handleBatchDelete = async (force: boolean = false) => {
        if (!onBatchDelete || selectedRows.size === 0) return;

        setBatchDeleteLoading(true);
        try {
            await onBatchDelete(Array.from(selectedRows), force);
            setSelectedRows(new Set());
            setIsAllSelected(false);
            setShowBatchDeleteDialog(false);
            toast.success(`Successfully processed batch delete operation`);
        } catch (error) {
            toast.error('Batch delete operation failed');
            console.error('Batch delete error:', error);
        } finally {
            setBatchDeleteLoading(false);
        }
    };

    const activeFilterCount = Object.values(activeFilters).filter(value => Boolean(value) && value !== 'all').length +
        (dateRange?.startDate && dateRange?.endDate ? 1 : 0) +
        (searchTerm ? 1 : 0);

    return (
        <div className={cn("space-y-4", className)}>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center space-x-2 flex-1">
                    {searchable && (
                        <div className="relative max-w-sm">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    )}

                    {filterable && filters.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Filters
                            {activeFilterCount > 0 && (
                                <Badge variant="secondary" className="ml-2">
                                    {activeFilterCount}
                                </Badge>
                            )}
                        </Button>
                    )}

                    {activeFilterCount > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={clearFilters}
                        >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Clear
                        </Button>
                    )}

                    {batchDelete && selectedRows.size > 0 && (
                        <AlertDialog open={showBatchDeleteDialog} onOpenChange={setShowBatchDeleteDialog}>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete ({selectedRows.size})
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center">
                                        <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                                        Confirm Batch Delete
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to delete {selectedRows.size} {entityName}? This action cannot be undone.
                                        <br /><br />
                                        <strong>Note:</strong> Items with dependencies will be archived instead of permanently deleted unless force delete is used.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => handleBatchDelete(false)}
                                        disabled={batchDeleteLoading}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        {batchDeleteLoading ? 'Processing...' : 'Archive Selected'}
                                    </AlertDialogAction>
                                    <AlertDialogAction
                                        onClick={() => handleBatchDelete(true)}
                                        disabled={batchDeleteLoading}
                                        className="bg-red-800 hover:bg-red-900"
                                    >
                                        {batchDeleteLoading ? 'Processing...' : 'Force Delete'}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>

                {exportable && exports.length > 0 && (
                    <div className="flex items-center space-x-2">
                        {exports.map((exportOption, exportIndex) => (
                            <Button
                                key={`export-${exportOption.format}-${exportIndex}`}
                                variant="outline"
                                size="sm"
                                onClick={() => handleExport(exportOption.format, exportOption.printAll)}
                            >
                                {exportOption.format === 'xlsx' && <FileSpreadsheet className="h-4 w-4 mr-2" />}
                                {exportOption.format === 'csv' && <File className="h-4 w-4 mr-2" />}
                                {exportOption.format === 'pdf' && <FileText className="h-4 w-4 mr-2" />}
                                {exportOption.label}
                            </Button>
                        ))}
                    </div>
                )}
            </div>

            {/* Filters */}
            {showFilters && filterable && filters.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/20">
                    {filters.map((filter, filterIndex) => (
                        <div key={`filter-${filter.key}-${filterIndex}`} className="space-y-2">
                            <label className="text-sm font-medium">{filter.label}</label>
                            {filter.type === 'text' && (
                                <Input
                                    placeholder={filter.placeholder}
                                    value={activeFilters[filter.key] || ''}
                                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                                />
                            )}
                            {filter.type === 'select' && (
                                <Select
                                    value={activeFilters[filter.key] || 'all'}
                                    onValueChange={(value) => handleFilterChange(filter.key, value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={filter.placeholder} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filter.options?.map((option, optionIndex) => (
                                            <SelectItem key={`${filter.key}-option-${option.value}-${optionIndex}`} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    ))}

                    {/* Date Range Filter */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Date Range</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        (!dateRange?.startDate || !dateRange?.endDate) && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange?.startDate && dateRange?.endDate ? (
                                        <>
                                            {formatDate(dateRange.startDate, "LLL dd, y")} -{" "}
                                            {formatDate(dateRange.endDate, "LLL dd, y")}
                                        </>
                                    ) : (
                                        "Pick a date range"
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <DateRangePicker
                                    ranges={[{
                                        startDate: dateRange?.startDate || new Date(),
                                        endDate: dateRange?.endDate || new Date(),
                                        key: 'selection'
                                    }]}
                                    onChange={(ranges: any) => {
                                        const selection = ranges.selection;
                                        setDateRange({
                                            startDate: selection.startDate,
                                            endDate: selection.endDate,
                                            key: 'selection'
                                        });
                                    }}
                                    showSelectionPreview={true}
                                    moveRangeOnFirstSelection={false}
                                    months={2}
                                    direction="horizontal"
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="rounded-md border overflow-x-auto bg-white dark:bg-[#18181b]">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {batchDelete && (
                                <TableHead className="w-12">
                                    <Checkbox
                                        checked={isAllSelected}
                                        onCheckedChange={handleSelectAll}
                                        aria-label="Select all"
                                    />
                                </TableHead>
                            )}
                            {columns.map((column, columnIndex) => (
                                <TableHead
                                    key={`column-${column.key}-${columnIndex}`}
                                    className={cn(
                                        column.sortable && "cursor-pointer hover:bg-muted/50",
                                        column.width && column.width
                                    )}
                                    onClick={() => column.sortable && handleSort(column.key)}
                                >
                                    <div className="flex items-center space-x-2">
                                        <span>{column.label}</span>
                                        {column.sortable && sortColumn === column.key && (
                                            <span className="text-xs">
                                                {sortDirection === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={columns.length + (batchDelete ? 1 : 0)} className="text-center py-8">
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                        <span className="ml-2">Loading...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length + (batchDelete ? 1 : 0)} className="text-center py-8 text-muted-foreground">
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((row, index) => {
                                const uniqueKey = row[rowKey] || `row-${index}`;
                                const isSelected = selectedRows.has(row[rowKey]);
                                return (
                                    <TableRow key={uniqueKey} className={isSelected ? 'bg-muted/50' : ''}>
                                        {batchDelete && (
                                            <TableCell>
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={(checked) => handleRowSelect(row[rowKey], checked)}
                                                    aria-label={`Select row ${uniqueKey}`}
                                                />
                                            </TableCell>
                                        )}
                                        {columns.map((column, columnIndex) => (
                                            <TableCell key={`${uniqueKey}-${column.key}-${columnIndex}`}>
                                                {column.render
                                                    ? column.render(row[column.key], row)
                                                    : row[column.key]
                                                }
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {pagination && !loading && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-2 py-4">
                    <div className="flex items-center space-x-2">
                        <p className="text-sm text-muted-foreground">
                            Showing {Math.max(1, (pagination.current_page - 1) * (pagination.per_page || 10) + 1)}-
                            {Math.min(pagination.current_page * (pagination.per_page || 10), pagination.total)} of {pagination.total} results
                        </p>
                        <Select
                            value={(pagination.per_page || 10).toString()}
                            onValueChange={(value) => onPerPageChange?.(parseInt(value))}
                        >
                            <SelectTrigger className="w-20">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>
                        <span className="text-sm text-muted-foreground">per page</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange?.(1)}
                            disabled={pagination.current_page === 1}
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange?.(pagination.current_page - 1)}
                            disabled={pagination.current_page === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Page {pagination.current_page} of {pagination.last_page}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange?.(pagination.current_page + 1)}
                            disabled={pagination.current_page === pagination.last_page}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange?.(pagination.last_page)}
                            disabled={pagination.current_page === pagination.last_page}
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
