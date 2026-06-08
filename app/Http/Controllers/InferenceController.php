<?php

namespace App\Http\Controllers;

use App\Models\Beehive;
use App\Models\Inference;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InferenceController extends Controller
{
    public function index()
    {
        return Inertia::render('inferences', [
            'inferences' => Inference::with('beehive')->latest('analyzed_at')->get(),
            'beehives'   => Beehive::select('hive_id', 'hive_name', 'hive_location')->get(),
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

        return redirect()->route('inferences.index');
    }
}
