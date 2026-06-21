import React, { useEffect, useMemo, type ReactNode } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import {
    MaterialReactTable,
    useMaterialReactTable,
    type MRT_ColumnDef,
    type MRT_SortingState,
    type MRT_ColumnFiltersState,
    type MRT_VisibilityState,
    type MRT_RowSelectionState,
    type MRT_PaginationState,
} from 'material-react-table';

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
    initialColumnVisibility,
    ...rest
}: {
    columns: MRT_ColumnDef<T>[];
    data: T[];
    getRowId: (row: T) => string;
    enableRowActions?: boolean;
    renderRowActionMenuItems?: (props: any) => ReactNode[];
    initialColumnVisibility?: MRT_VisibilityState;
    [key: string]: any;
}) {
    return (
        <ThemeProvider theme={theme}>
            <DataTableInner
                columns={columns}
                data={data}
                getRowId={getRowId}
                enableRowActions={enableRowActions}
                renderRowActionMenuItems={renderRowActionMenuItems}
                initialColumnVisibility={initialColumnVisibility}
                {...rest}
            />
        </ThemeProvider>
    );
}

function DataTableInner<T extends Record<string, any>>({
    columns,
    data,
    getRowId,
    enableRowActions,
    renderRowActionMenuItems,
    initialColumnVisibility,
    ...rest
}: {
    columns: MRT_ColumnDef<T>[];
    data: T[];
    getRowId: (row: T) => string;
    enableRowActions?: boolean;
    renderRowActionMenuItems?: (props: any) => ReactNode[];
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
    useEffect(() => {
        setPagination((p) => (p.pageIndex === 0 ? p : { ...p, pageIndex: 0 }));
    }, [columnFilters, globalFilter]);

    const tableData = useMemo(() => data, [data]);

    const table = useMaterialReactTable({
        columns,
        data: tableData,
        getRowId,
        enableSorting: true,
        enableColumnFilters: true,
        enableColumnActions: true,
        enableHiding: true,
        enableRowSelection: false,
        enableMultiRowSelection: false,
        enableRowActions,
        renderRowActionMenuItems,
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
        muiTableBodyRowProps: () => ({
            onClick: undefined,
            onDoubleClick: undefined,
            sx: {
                cursor: 'default',
            },
        }),
        ...(enableRowActions ? { positionActionsColumn: 'last' as const } : {}),
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
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onGlobalFilterChange: setGlobalFilter,
        onPaginationChange: setPagination,
        ...rest,
    });

    return <MaterialReactTable table={table} />;
}
