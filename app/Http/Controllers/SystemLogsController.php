<?php

namespace App\Http\Controllers;

use App\Models\SystemLog;
use Illuminate\Http\Request;

class SystemLogsController extends Controller
{
    public function index(Request $request)
    {
        $level      = $request->input('level', '');
        $eventType  = $request->input('event_type', '');
        $search     = $request->input('search', '');

        $logs = SystemLog::with(['hive:hive_id,hive_name', 'user:user_id,full_name'])
            ->when($level,     fn($q) => $q->where('level', $level))
            ->when($eventType, fn($q) => $q->where('event_type', $eventType))
            ->when($search,    fn($q) => $q->where(function ($sq) use ($search) {
                $sq->where('message', 'ilike', "%{$search}%")
                   ->orWhere('event_type', 'ilike', "%{$search}%")
                   ->orWhere('level', 'ilike', "%{$search}%")
                   ->orWhereHas('hive', fn($hq) => $hq->where('hive_name', 'ilike', "%{$search}%"))
                   ->orWhereHas('user', fn($uq) => $uq->where('full_name', 'ilike', "%{$search}%"));
            }))
            ->latest('created_at')
            ->paginate(50)
            ->through(fn($l) => [
                'log_id'     => $l->log_id,
                'level'      => $l->level,
                'event_type' => $l->event_type,
                'message'    => $l->message,
                'details'    => $l->details,
                'hive_name'  => $l->hive?->hive_name,
                'user_name'  => $l->user?->full_name,
                'created_at' => $l->created_at?->toIso8601String(),
            ]);

        $stats = [
            'total'   => SystemLog::count(),
            'errors'  => SystemLog::where('level', 'error')->count(),
            'warnings'=> SystemLog::where('level', 'warning')->count(),
            'info'    => SystemLog::where('level', 'info')->count(),
        ];

        $eventTypes = SystemLog::selectRaw('event_type, count(*) as cnt')
            ->groupBy('event_type')
            ->orderByDesc('cnt')
            ->pluck('event_type');

        return inertia('system-logs', [
            'logs'       => $logs,
            'stats'      => $stats,
            'eventTypes' => $eventTypes,
            'filters'    => compact('level', 'eventType', 'search'),
        ]);
    }
}
