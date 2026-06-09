<?php

namespace App\Http\Controllers;

use App\Models\AdvisoryAction;
use App\Models\Alerts;
use App\Models\AudioSource;
use App\Models\Beehive;
use App\Models\Inference;
use App\Models\SystemLog;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        $now   = Carbon::now();
        $today = $now->toDateString();

        // ── Summary stats ──────────────────────────────────────────
        $totalHives      = Beehive::count();
        $hivesThisMonth  = Beehive::whereMonth('created_at', $now->month)
                                  ->whereYear('created_at', $now->year)
                                  ->count();
        $totalBeekeepers = User::whereIn('role', ['farmer', 'farmer_pending'])->count();
        $activeAlerts    = Alerts::whereNotIn('action_status', ['resolved', 'dismissed'])->count();
        $alertsYesterday = Alerts::whereDate('created_at', $now->copy()->subDay()->toDateString())
                                 ->whereNotIn('action_status', ['resolved', 'dismissed'])
                                 ->count();
        $recordingsToday = AudioSource::whereDate('captured_at', $today)->count();
        $recordingsYest  = AudioSource::whereDate('captured_at', Carbon::yesterday()->toDateString())->count();
        $needAttention   = Alerts::whereNotIn('action_status', ['resolved', 'dismissed'])
                                 ->whereIn('severity_level', ['critical', 'high'])
                                 ->count();

        // ── Top 5 hives with latest inference (LATERAL join) ───────
        $hivesRaw = DB::select("
            SELECT
                b.hive_id, b.hive_name, b.hive_type, b.hive_location,
                COALESCE(ir.hive_state, 'unknown') AS hive_state,
                ir.confidence_score
            FROM hives b
            LEFT JOIN LATERAL (
                SELECT hive_state, confidence_score
                FROM inference_results
                WHERE hive_id = b.hive_id
                ORDER BY analyzed_at DESC LIMIT 1
            ) ir ON true
            ORDER BY b.created_at DESC LIMIT 5
        ");
        $hivesList = collect($hivesRaw)->map(fn($h) => [
            'id'         => $h->hive_id,
            'name'       => $h->hive_name ?? 'Unnamed Hive',
            'type'       => $h->hive_type ?? '',
            'location'   => $h->hive_location,
            'hive_state' => $h->hive_state,
            'confidence' => $h->confidence_score !== null
                                ? round((float) $h->confidence_score * 100) : null,
        ])->values();

        // ── Hive state categories for donut ────────────────────────
        $catRaw = DB::select("
            SELECT
                CASE
                    WHEN COALESCE(ir.hive_state,'unknown') IN ('normal','healthy') THEN 'normal'
                    WHEN COALESCE(ir.hive_state,'unknown') IN ('swarming','critical') THEN 'critical'
                    ELSE 'at_risk'
                END AS category,
                COUNT(*) AS count
            FROM hives b
            LEFT JOIN LATERAL (
                SELECT hive_state FROM inference_results
                WHERE hive_id = b.hive_id ORDER BY analyzed_at DESC LIMIT 1
            ) ir ON true
            GROUP BY category
        ");
        $hiveCategories = ['normal' => 0, 'at_risk' => 0, 'critical' => 0];
        foreach ($catRaw as $row) {
            $hiveCategories[$row->category] = (int) $row->count;
        }

        // ── Inference distribution for bar chart ───────────────────
        $infRaw   = Inference::selectRaw('hive_state, count(*) as cnt')
                             ->groupBy('hive_state')->orderByDesc('cnt')->get();
        $totalInf = $infRaw->sum('cnt');
        $inferenceDistribution = $infRaw->map(fn($r) => [
            'state'      => $r->hive_state,
            'percentage' => $totalInf > 0 ? round($r->cnt / $totalInf * 100) : 0,
        ])->values();

        // ── Recent alerts (last 4) ─────────────────────────────────
        $recentAlerts = Alerts::with('hive:hive_id,hive_name,hive_location')
            ->latest('alert_timestamp')
            ->take(4)
            ->get()
            ->map(fn($a) => [
                'id'               => $a->alert_id,
                'hive_name'        => $a->hive?->hive_name ?? 'Unknown Hive',
                'hive_location'    => $a->hive?->hive_location ?? '',
                'severity_level'   => $a->severity_level,
                'recommended_action' => $a->recommended_action,
                'action_status'    => $a->action_status,
                'alert_timestamp'  => $a->alert_timestamp?->toIso8601String(),
            ]);

        // ── Advisory action counts + high priority list ────────────
        $actionCounts = AdvisoryAction::selectRaw('status, count(*) as cnt')
            ->groupBy('status')->get()
            ->mapWithKeys(fn($r) => [$r->status => (int) $r->cnt]);

        $highPriorityActions = DB::table('advisory_actions as aa')
            ->leftJoin('hives as b', 'aa.hive_id', '=', 'b.hive_id')
            ->where('aa.priority_level', 'high')
            ->where('aa.status', 'pending')
            ->orderByDesc('aa.created_at')
            ->limit(3)
            ->select('aa.action_description', 'b.hive_name')
            ->get()
            ->map(fn($r) => [
                'description' => $r->action_description,
                'hive_name'   => $r->hive_name,
            ]);

        // ── System logs (last 6) ───────────────────────────────────
        $systemLogs = SystemLog::latest('created_at')
            ->take(6)
            ->get()
            ->map(fn($l) => [
                'level'      => strtoupper($l->level),
                'message'    => $l->message,
                'created_at' => $l->created_at?->format('H:i'),
            ]);

        return inertia('dashboard', [
            'stats' => [
                'total_hives'          => $totalHives,
                'hives_this_month'     => $hivesThisMonth,
                'total_beekeepers'     => $totalBeekeepers,
                'active_alerts'        => $activeAlerts,
                'alerts_yesterday'     => $alertsYesterday,
                'recordings_today'     => $recordingsToday,
                'recordings_yesterday' => $recordingsYest,
                'need_attention'       => $needAttention,
            ],
            'greeting_name'          => ($authUser = auth()->user()) && $authUser->full_name
                                          ? explode(' ', $authUser->full_name)[0]
                                          : 'Admin',
            'hives_list'             => $hivesList,
            'hive_categories'        => $hiveCategories,
            'inference_distribution' => $inferenceDistribution,
            'recent_alerts'          => $recentAlerts,
            'action_counts'          => $actionCounts,
            'high_priority_actions'  => $highPriorityActions,
            'system_logs'            => $systemLogs,
        ]);
    }
}
