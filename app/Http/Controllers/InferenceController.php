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
            'beehives'   => Beehive::select('id', 'hive_location')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'hive_id'           => ['required', 'string', 'exists:beehives,id'],
            'prediction'        => ['required', 'string', 'in:Normal,Pre-swarm,Swarm,Abscondment,Uncertain'],
            'confidence_score'  => ['required', 'numeric', 'min:0', 'max:100'],
            'inference_latency' => ['required', 'numeric', 'min:0'],
            'analyzed_at'       => ['required', 'date'],
        ]);

        Inference::create($validated);

        return redirect()->route('inferences.index');
    }
}
