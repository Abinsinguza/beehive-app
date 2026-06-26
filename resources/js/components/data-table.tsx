import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
    MaterialReactTable,
    useMaterialReactTable
    
    
    
    
    
    
} from 'material-react-table';
import type {MRT_ColumnDef, MRT_SortingState, MRT_ColumnFiltersState, MRT_VisibilityState, MRT_RowSelectionState, MRT_PaginationState} from 'material-react-table';
import React, { useMemo } from 'react';
import type {ReactNode} from 'react';

const theme = createTheme({
    components: {
        MuiPopover: {
            defaultProps: {
                transitionDuration: 0,
            },
        },
        MuiMenu: {
            defaultProps: {
                transitionDuration: 0,
            },
        },
        MuiTooltip: {
            defaultProps: {
                enterDelay: 0,
                leaveDelay: 0,
                enterNextDelay: 0,
            },
            styleOverrides: {
                tooltip: {
                    transition: 'none !important',
                },
            },
        },
    },
});

export function DataTable<T extends Record<string, any>>({
    columns,
    data,
    getRowId,
    enableRowActions = false,
    renderRowActionMenuItems,
    renderDetailPanel,
    initialColumnVisibility,
    ...rest
}: {
    columns: MRT_ColumnDef<T>[];
    data: T[];
    getRowId: (row: T) => string;
    enableRowActions?: boolean;
    renderRowActionMenuItems?: (props: any) => ReactNode[];
    renderDetailPanel?: (props: { row: any }) => ReactNode;
    initialColumnVisibility?: MRT_VisibilityState;
    [key: string]: any;
}) {
    return (
        <ThemeProvider theme={theme}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DataTableInner
                    columns={columns}
                    data={data}
                    getRowId={getRowId}
                    enableRowActions={enableRowActions}
                    renderRowActionMenuItems={renderRowActionMenuItems}
                    renderDetailPanel={renderDetailPanel}
                    initialColumnVisibility={initialColumnVisibility}
                    {...rest}
                />
            </LocalizationProvider>
        </ThemeProvider>
    );
}

function DataTableInner<T extends Record<string, any>>({
    columns,
    data,
    getRowId,
    enableRowActions,
    renderRowActionMenuItems,
    renderDetailPanel,
    initialColumnVisibility,
    ...rest
}: {
    columns: MRT_ColumnDef<T>[];
    data: T[];
    getRowId: (row: T) => string;
    enableRowActions?: boolean;
    renderRowActionMenuItems?: (props: any) => ReactNode[];
    renderDetailPanel?: (props: { row: any }) => ReactNode;
    initialColumnVisibility?: MRT_VisibilityState;
    [key: string]: any;
}) {
    const [sorting, setSorting] = React.useState<MRT_SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<MRT_ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<MRT_VisibilityState>(initialColumnVisibility ?? {});
    const [rowSelection, setRowSelection] = React.useState<MRT_RowSelectionState>({});
    const [globalFilter, setGlobalFilter] = React.useState<string>('');
    const [pagination, setPagination] = React.useState<MRT_PaginationState>({ pageIndex: 0, pageSize: 10 });

    // Jump back to page 1 whenever filters/search narrow the result set,
    // otherwise the current page can land past the end and render as empty.
    const resetToFirstPage = () => setPagination((p) => (p.pageIndex === 0 ? p : { ...p, pageIndex: 0 }));

    const handleColumnFiltersChange: typeof setColumnFilters = (updater) => {
        setColumnFilters(updater);
        resetToFirstPage();
    };

    const handleGlobalFilterChange: typeof setGlobalFilter = (updater) => {
        setGlobalFilter(updater);
        resetToFirstPage();
    };

    const tableData = useMemo(() => data, [data]);

    const table = useMaterialReactTable({
        columns,
        data: tableData,
        getRowId,
        enableSorting: true,
        enableColumnFilters: false,
        enableColumnActions: true,
        enableHiding: true,
        enableGlobalFilter: false,
        displayColumnDefOptions: { 'mrt-row-expand': { visibleInShowHideMenu: false } },
        enableRowSelection: false,
        enableMultiRowSelection: false,
        enableRowActions,
        renderRowActionMenuItems,
        renderDetailPanel,
        enableExpanding: !!renderDetailPanel,
        enableRowOrdering: false,
        enablePagination: true,
        paginationDisplayMode: 'pages',
        muiPaginationProps: {
            rowsPerPageOptions: [10, 20, 50, 100],
            showRowsPerPage: true,
        },
        enableRowNumbers: false,
        enableStickyHeader: true,
        enableStickyFooter: false,
        enableDensityToggle: false,
        muiTableBodyRowProps: () => ({
            onClick: undefined,
            onDoubleClick: undefined,
            sx: {
                cursor: 'default',
            },
        }),
        ...(enableRowActions ? { positionActionsColumn: 'last' as const } : {}),
        initialState: {
            density: 'compact',
            ...(rest.initialState || {}),
        },
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            globalFilter,
            pagination,
            ...(rest.state || {}),
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: handleColumnFiltersChange,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onGlobalFilterChange: handleGlobalFilterChange,
        onPaginationChange: setPagination,
        ...rest,
    });

    return (
        <div className="overflow-x-auto">
            <MaterialReactTable table={table} />
        </div>
    );
}
