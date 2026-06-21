import React, { useMemo, type ReactNode } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import {
    MaterialReactTable,
    useMaterialReactTable,
    type MRT_ColumnDef,
    type MRT_SortingState,
    type MRT_ColumnFiltersState,
    type MRT_VisibilityState,
    type MRT_RowSelectionState,
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
    ...rest
}: {
    columns: MRT_ColumnDef<T>[];
    data: T[];
    getRowId: (row: T) => string;
    enableRowActions?: boolean;
    renderRowActionMenuItems?: (props: any) => ReactNode[];
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
    ...rest
}: {
    columns: MRT_ColumnDef<T>[];
    data: T[];
    getRowId: (row: T) => string;
    enableRowActions?: boolean;
    renderRowActionMenuItems?: (props: any) => ReactNode[];
    [key: string]: any;
}) {
    const [sorting, setSorting] = React.useState<MRT_SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<MRT_ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<MRT_VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState<MRT_RowSelectionState>({});
    const [globalFilter, setGlobalFilter] = React.useState<string>('');

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
            ...(rest.state || {}),
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onGlobalFilterChange: setGlobalFilter,
        ...rest,
    });

    return <MaterialReactTable table={table} />;
}
