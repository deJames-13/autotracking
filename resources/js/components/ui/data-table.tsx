import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
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
    File
} from 'lucide-react';
import { format as formatDate } from 'date-fns';
import { cn } from '@/lib/utils';
import { DateRangePicker } from 'react-date-range';
import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file

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
    format: 'excel' | 'csv' | 'pdf';
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
    className?: string;
    emptyMessage?: string;
    searchDebounceMs?: number;
    rowKey?: string; // Key field for unique row identification
}

export function DataTable<T = any>({
    data,
    columns,
    loading = false,
    searchable = true,
    filterable = true,
    filters = [],
    exportable = false,
    exports = [],
    pagination,
    onSearch,
    onFilter,
    onSort,
    onPageChange,
    onPerPageChange,
    onExport,
    className,
    emptyMessage = "No data available",
    searchDebounceMs = 500,
    rowKey = 'id', // Default to 'id' field
}: DataTableProps<T>) {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
    const [sortColumn, setSortColumn] = useState<string>('');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [showFilters, setShowFilters] = useState(false);
    const [dateRange, setDateRange] = useState<{
        startDate: Date;
        endDate: Date;
        key: string;
    }>({
        startDate: new Date(),
        endDate: new Date(),
        key: 'selection'
    });
    const isFirstRender = useRef(true);

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
            startDate: new Date(),
            endDate: new Date(),
            key: 'selection'
        });
        setSearchTerm('');
    };

    const handleExport = (exportFormat: string) => {
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
            };
            onExport(exportFormat, exportFilters);
        }
    };

    const renderPagination = () => {
        if (!pagination || loading) return null;

        const {
            current_page = 1,
            last_page = 1,
            per_page = 15,
            total = 0
        } = pagination;

        // Additional safety checks
        if (!per_page || per_page <= 0 || isNaN(per_page)) {
            console.warn('Invalid per_page value:', per_page);
            return null;
        }

        if (total === 0 && data.length === 0) return null;

        const startItem = Math.max(1, (current_page - 1) * per_page + 1);
        const endItem = Math.min(current_page * per_page, total);

        return (
            <div className="flex items-center justify-between px-2 py-4">
                <div className="flex items-center space-x-2">
                    <p className="text-sm text-muted-foreground">
                        Showing {startItem}-{endItem} of {total} results
                    </p>
                    <Select
                        value={per_page.toString()}
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
                        disabled={current_page === 1}
                    >
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange?.(current_page - 1)}
                        disabled={current_page === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Page {current_page} of {last_page}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange?.(current_page + 1)}
                        disabled={current_page === last_page}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange?.(last_page)}
                        disabled={current_page === last_page}
                    >
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        );
    };

    const activeFilterCount = Object.values(activeFilters).filter(value => Boolean(value) && value !== 'all').length +
        (dateRange?.startDate && dateRange?.endDate &&
            dateRange.startDate.getTime() !== dateRange.endDate.getTime() ? 1 : 0) +
        (searchTerm ? 1 : 0);

    return (
        <div className={cn("space-y-4", className)}>
            {/* Toolbar */}
            <div className="flex items-center justify-between">
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
                </div>

                {exportable && exports.length > 0 && (
                    <div className="flex items-center space-x-2">
                        {exports.map((exportOption, exportIndex) => (
                            <Button
                                key={`export-${exportOption.format}-${exportIndex}`}
                                variant="outline"
                                size="sm"
                                onClick={() => handleExport(exportOption.format)}
                            >
                                {exportOption.format === 'excel' && <FileSpreadsheet className="h-4 w-4 mr-2" />}
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
                                        <SelectItem value="all">All</SelectItem>
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
                                        (!dateRange?.startDate || !dateRange?.endDate ||
                                            dateRange.startDate.getTime() === dateRange.endDate.getTime()) && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange?.startDate && dateRange?.endDate &&
                                        dateRange.startDate.getTime() !== dateRange.endDate.getTime() ? (
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
                                    ranges={[dateRange]}
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
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
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
                                <TableCell colSpan={columns.length} className="text-center py-8">
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                        <span className="ml-2">Loading...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((row, index) => {
                                const uniqueKey = row[rowKey] || `row-${index}`;
                                return (
                                    <TableRow key={uniqueKey}>
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
            {renderPagination()}
        </div>
    );
}
