<?php

namespace App\Http\Controllers;

use App\Models\Beehive;
use App\Models\Inference;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class InferenceController extends Controller
{
    public function index(Request $request)
    {
        $state  = $request->input('state', '');
        $search = $request->input('search', '');

        $inferences = Inference::with('beehive:hive_id,hive_name,hive_location')
            ->when($state,  fn($q) => $q->where('hive_state', $state))
            ->when($search, fn($q) => $q->where(function ($q) use ($search) {
                $q->whereHas('beehive', fn($q) => $q->where('hive_name', 'ilike', "%{$search}%"))
                  ->orWhere('hive_state', 'ilike', "%{$search}%")
                  ->orWhere('inference_id', 'ilike', "%{$search}%");
            }))
            ->latest('analyzed_at')
            ->get();

        $stats = [
            'total'   => Inference::count(),
            'avg_confidence' => Inference::avg('confidence_score'),
            'avg_latency'    => Inference::whereNotNull('inference_latency_ms')->avg('inference_latency_ms'),
            'swarm_count'    => Inference::whereIn('hive_state', ['swarm', 'pre_swarm'])->count(),
        ];

        // ── Growth trends — cumulative beekeeper/hive totals, weekly (last 7 days) & yearly (Jan–Dec) ──
        $now = Carbon::now();
        $beekeeperRoles = ['farmer', 'farmer_pending', 'farmer_revoked'];

        $growthWeekly = collect(range(6, 0))->map(function ($daysAgo) use ($now, $beekeeperRoles) {
            $cutoff = $now->copy()->subDays($daysAgo)->endOfDay();
            return [
                'label'      => $cutoff->format('D'),
                'beekeepers' => User::whereIn('role', $beekeeperRoles)->where('created_at', '<=', $cutoff)->count(),
                'hives'      => Beehive::where('created_at', '<=', $cutoff)->count(),
            ];
        })->values();

        $growthYearly = collect(range(1, 12))->map(function ($month) use ($now, $beekeeperRoles) {
            $cutoff = Carbon::create($now->year, $month, 1)->endOfMonth();
            return [
                'label'      => $cutoff->format('M'),
                'beekeepers' => User::whereIn('role', $beekeeperRoles)->where('created_at', '<=', $cutoff)->count(),
                'hives'      => Beehive::where('created_at', '<=', $cutoff)->count(),
            ];
        })->values();

        // ── Confidence & latency over time — anchored to the most recent inference, not wall-clock now ──
        $confidenceRange = $request->input('confidence_range', '24h');
        $hoursMap = ['1h' => 1, '24h' => 24, '7d' => 24 * 7];
        $hours = $hoursMap[$confidenceRange] ?? 24;

        $latestAnalyzedAt = Inference::max('analyzed_at');
        $confidenceSeries = [];
        $confidenceStats  = [
            'min_confidence' => null, 'max_confidence' => null,
            'min_latency'    => null, 'max_latency'    => null,
        ];

        if ($latestAnalyzedAt) {
            $anchor = Carbon::parse($latestAnalyzedAt);
            $since  = $anchor->copy()->subHours($hours);

            $rows = Inference::whereBetween('analyzed_at', [$since, $anchor])
                ->orderBy('analyzed_at')
                ->get(['confidence_score', 'inference_latency_ms', 'analyzed_at']);

            $confidenceSeries = $rows->map(fn($r) => [
                't'          => $r->analyzed_at?->toIso8601String(),
                'confidence' => (float) $r->confidence_score,
                'latency'    => $r->inference_latency_ms !== null ? (float) $r->inference_latency_ms : null,
            ])->values();

            $confidenceStats = [
                'min_confidence' => $rows->min('confidence_score'),
                'max_confidence' => $rows->max('confidence_score'),
                'min_latency'    => $rows->whereNotNull('inference_latency_ms')->min('inference_latency_ms'),
                'max_latency'    => $rows->whereNotNull('inference_latency_ms')->max('inference_latency_ms'),
            ];
        }

        // ── Hive status breakdown for donut — mirrors dashboard's "Hive states" ──
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

        return Inertia::render('inferences', [
            'inferences' => $inferences,
            'beehives'   => Beehive::select('hive_id', 'hive_name', 'hive_location')->get(),
            'stats'      => $stats,
            'filters'    => compact('state', 'search'),
            'growth_weekly'   => $growthWeekly,
            'growth_yearly'   => $growthYearly,
            'hive_categories' => $hiveCategories,
            'confidence_series' => $confidenceSeries,
            'confidence_stats'  => $confidenceStats,
            'confidence_range'  => $confidenceRange,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'hive_id'              => ['required', 'string', 'exists:hives,hive_id'],
            'audio_id'             => ['nullable', 'string'],
            'hive_state'           => ['required', 'string', 'max:50'],
            'confidence_score'     => ['required', 'numeric', 'min:0', 'max:1'],
            'inference_latency_ms' => ['nullable', 'numeric', 'min:0'],
            'analyzed_at'          => ['required', 'date'],
        ]);

        Inference::create($validated);

        return redirect()->route('analytics');
    }
}
