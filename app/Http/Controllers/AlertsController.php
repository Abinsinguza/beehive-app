<?php

namespace App\Http\Controllers;

use App\Models\Advisory;
use App\Models\Alerts;
use App\Models\Inference;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AlertsController extends Controller
{
    public function index()
    {
        return Inertia::render('alerts', [
            'alerts'     => Alerts::with(['inference.beehive.owner', 'advisory'])
                                ->latest()
                                ->get(),
            'inferences' => Inference::with('beehive')->get(['id', 'hive_id', 'prediction']),
            'advisories' => Advisory::get(['id', 'condition_label', 'advisory_text']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'inference_id'    => ['required', 'integer', 'exists:inferences,id'],
            'advisory_id'     => ['required', 'integer', 'exists:advisories,id'],
            'alert_type'      => ['required', 'string', 'in:Info,Warning,Critical,Threat'],
            'alert_timestamp' => ['required', 'date'],
        ]);

        $last   = Alerts::orderBy('id', 'desc')->first();
        $number = $last ? ((int) substr($last->alert_id, 2)) + 1 : 1;
        $validated['alert_id'] = 'AL' . str_pad($number, 4, '0', STR_PAD_LEFT);
        $validated['status']   = 'pending';

        Alerts::create($validated);

        return redirect()->route('alerts.index');
    }

    public function notify(Alerts $alert)
    {
        $alert->update(['status' => 'sent']);

        return redirect()->route('alerts.index');
    }
}
