<?php

namespace App\Http\Controllers;

use App\Models\Alerts;
use App\Models\AudioSource;
use App\Models\Beehive;
use App\Models\Inference;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
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
        $totalBeekeepers     = User::whereIn('role', ['farmer', 'farmer_pending'])->count();
        $beekeepersThisMonth = User::whereIn('role', ['farmer', 'farmer_pending'])
                                   ->whereMonth('created_at', $now->month)
                                   ->whereYear('created_at', $now->year)
                                   ->count();
        $activeAlerts    = Alerts::whereDate('created_at', $today)
                                 ->whereNotIn('action_status', ['resolved', 'dismissed'])->count();
        $alertsYesterday = Alerts::whereDate('created_at', $now->copy()->subDay()->toDateString())
                                 ->whereNotIn('action_status', ['resolved', 'dismissed'])
                                 ->count();
        $recordingsToday = AudioSource::whereDate('created_at', $today)->count();
        $recordingsYest  = AudioSource::whereDate('created_at', Carbon::yesterday()->toDateString())->count();
        $needAttention   = Alerts::whereNotIn('action_status', ['resolved', 'dismissed'])
                                 ->whereIn('severity_level', ['critical', 'high'])
                                 ->count();

        // ── Top 5 most recently updated hives with latest inference (LATERAL join) ───────
        $hivesRaw = DB::select("
            SELECT
                b.hive_id, b.hive_name, b.hive_type, b.hive_location, b.updated_at,
                COALESCE(ir.hive_state, 'unknown') AS hive_state,
                ir.confidence_score
            FROM hives b
            LEFT JOIN LATERAL (
                SELECT hive_state, confidence_score
                FROM inference_results
                WHERE hive_id = b.hive_id
                ORDER BY analyzed_at DESC LIMIT 1
            ) ir ON true
            WHERE b.deleted_at IS NULL
            ORDER BY b.updated_at DESC LIMIT 5
        ");
        $hivesList = collect($hivesRaw)->map(fn($h) => [
            'id'         => $h->hive_id,
            'name'       => $h->hive_name ?? 'Unnamed Hive',
            'type'       => $h->hive_type ?? '',
            'location'   => $h->hive_location,
            'hive_state' => $h->hive_state,
            'confidence' => $h->confidence_score !== null
                                ? round((float) $h->confidence_score * 100) : null,
            'updated_at' => Carbon::parse($h->updated_at)->toIso8601String(),
        ])->values();

        // ── Hive state breakdown for donut — one bucket per real hive_state ──
        $catRaw = DB::select("
            SELECT
                COALESCE(ir.hive_state, 'unknown') AS category,
                COUNT(*) AS count
            FROM hives b
            LEFT JOIN LATERAL (
                SELECT hive_state FROM inference_results
                WHERE hive_id = b.hive_id ORDER BY analyzed_at DESC LIMIT 1
            ) ir ON true
            WHERE b.deleted_at IS NULL
            GROUP BY category
        ");
        $hiveCategories = [];
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

        // ── Recordings volume by ML-detected state — weekly (last 7 days) + monthly (last 6 months) ──
        $weeklyRaw = DB::table('audio_sources as a')
            ->leftJoin('inference_results as ir', 'ir.audio_id', '=', 'a.audio_id')
            ->selectRaw("DATE(a.created_at) as day, COALESCE(ir.hive_state, 'unanalyzed') as state, count(*) as cnt")
            ->where('a.created_at', '>=', $now->copy()->subDays(6)->startOfDay())
            ->groupBy('day', 'state')
            ->get()
            ->groupBy('day');

        $monthlyRaw = DB::table('audio_sources as a')
            ->leftJoin('inference_results as ir', 'ir.audio_id', '=', 'a.audio_id')
            ->selectRaw("to_char(a.created_at, 'YYYY-MM') as month, COALESCE(ir.hive_state, 'unanalyzed') as state, count(*) as cnt")
            ->where('a.created_at', '>=', $now->copy()->subMonths(5)->startOfMonth())
            ->groupBy('month', 'state')
            ->get()
            ->groupBy('month');

        // Only include states that actually occur, so the legend isn't cluttered with unused categories
        $recordingStates = $weeklyRaw->flatten(1)->merge($monthlyRaw->flatten(1))
            ->pluck('state')->unique()->values();

        $recordingsWeekly = collect(range(6, 0))->map(function ($daysAgo) use ($now, $weeklyRaw, $recordingStates) {
            $date = $now->copy()->subDays($daysAgo);
            $rows = $weeklyRaw[$date->toDateString()] ?? collect();
            $entry = ['label' => $date->format('D')];
            foreach ($recordingStates as $s) {
                $entry[$s] = (int) ($rows->firstWhere('state', $s)->cnt ?? 0);
            }
            return $entry;
        })->values();

        $recordingsMonthly = collect(range(5, 0))->map(function ($monthsAgo) use ($now, $monthlyRaw, $recordingStates) {
            $date = $now->copy()->subMonths($monthsAgo);
            $rows = $monthlyRaw[$date->format('Y-m')] ?? collect();
            $entry = ['label' => $date->format('M')];
            foreach ($recordingStates as $s) {
                $entry[$s] = (int) ($rows->firstWhere('state', $s)->cnt ?? 0);
            }
            return $entry;
        })->values();

        return inertia('dashboard', [
            'stats' => [
                'total_hives'          => $totalHives,
                'hives_this_month'     => $hivesThisMonth,
                'total_beekeepers'     => $totalBeekeepers,
                'beekeepers_this_month' => $beekeepersThisMonth,
                'active_alerts'        => $activeAlerts,
                'alerts_yesterday'     => $alertsYesterday,
                'recordings_today'     => $recordingsToday,
                'recordings_yesterday' => $recordingsYest,
                'need_attention'       => $needAttention,
            ],
            'greeting_name'          => ($authUser = Auth::user()) && $authUser->full_name
                                          ? explode(' ', $authUser->full_name)[0]
                                          : 'Admin',
            'hives_list'             => $hivesList,
            'hive_categories'        => $hiveCategories,
            'inference_distribution' => $inferenceDistribution,
            'recent_alerts'          => $recentAlerts,
            'recordings_weekly'      => $recordingsWeekly,
            'recordings_monthly'     => $recordingsMonthly,
            'recording_states'      => $recordingStates,
        ]);
    }
}
