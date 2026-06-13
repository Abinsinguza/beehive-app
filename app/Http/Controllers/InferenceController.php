<?php

namespace App\Http\Controllers;

use App\Models\Beehive;
use App\Models\Inference;
use Illuminate\Http\Request;
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
            ->paginate(10)
            ->withQueryString();

        $stats = [
            'total'   => Inference::count(),
            'avg_confidence' => Inference::avg('confidence_score'),
            'avg_latency'    => Inference::whereNotNull('inference_latency_ms')->avg('inference_latency_ms'),
            'swarm_count'    => Inference::whereIn('hive_state', ['swarm', 'pre_swarm'])->count(),
        ];

        return Inertia::render('inferences', [
            'inferences' => $inferences,
            'beehives'   => Beehive::select('hive_id', 'hive_name', 'hive_location')->get(),
            'stats'      => $stats,
            'filters'    => compact('state', 'search'),
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
