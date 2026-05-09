<?php

namespace App\Http\Controllers;

use App\Models\Advisory;
use App\Models\Alerts;
use App\Models\Inference;
use App\Services\SmsService;
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

    public function notify(Alerts $alert, SmsService $sms)
    {
        $alert->load(['inference.beehive.owner', 'advisory']);

        $beekeeper = $alert->inference?->beehive?->owner;
        $advisory  = $alert->advisory;

        if (! $beekeeper) {
            return redirect()->route('alerts.index')
                ->with('error', "Alert {$alert->alert_id}: no beekeeper linked to this hive.");
        }

        if (! $beekeeper->phone) {
            return redirect()->route('alerts.index')
                ->with('error', "Beekeeper \"{$beekeeper->name}\" has no phone number registered.");
        }

        $template = \App\Models\SystemSetting::get(
            'sms_template',
            "🐝 BEEHIVE ALERT [#alertType]\nHive: #beeHive @ #hiveLocation\nBeekeeper: #beekeeper\nPrediction: #prediction\nMessage: #alertMessage\nTime: #timestamp"
        );

        $message = strtr($template, [
            '#alertType'    => $alert->alert_type,
            '#beeHive'      => $alert->inference?->beehive?->id       ?? '—',
            '#hiveLocation' => $alert->inference?->beehive?->hive_location ?? '—',
            '#beekeeper'    => $beekeeper->name,
            '#prediction'   => $alert->inference?->prediction         ?? '—',
            '#confidence'   => '—',
            '#alertMessage' => $advisory?->advisory_text              ?? '—',
            '#timestamp'    => now()->format('Y-m-d H:i'),
        ]);

        try {
            $sms->send($beekeeper->phone, $message);
            $alert->update(['status' => 'sent']);

            return redirect()->route('alerts.index')
                ->with('success', "SMS sent to {$beekeeper->name} ({$beekeeper->phone}).");
        } catch (\Throwable $e) {
            return redirect()->route('alerts.index')
                ->with('error', "SMS failed: {$e->getMessage()}");
        }
    }
}
