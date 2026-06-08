<?php

namespace App\Http\Controllers;

use App\Models\AdvisoryTemplate;
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
            'inferences' => Inference::with('beehive')->get(['inference_id', 'hive_id', 'hive_state']),
            'advisories' => AdvisoryTemplate::orderBy('prediction_code')->get(['template_id', 'condition_label', 'advisory_text', 'advisory_type', 'severity']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'hive_id'            => ['required', 'string', 'exists:hives,hive_id'],
            'inference_id'       => ['required', 'string', 'exists:inference_results,inference_id'],
            'advisory_id'        => ['nullable', 'string', 'exists:advisories,advisory_id'],
            'severity_level'     => ['required', 'string', 'max:20'],
            'recommended_action' => ['nullable', 'string'],
            'action_status'      => ['required', 'string', 'max:20'],
            'alert_timestamp'    => ['required', 'date'],
        ]);

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
            '#alertType'    => $alert->severity_level,
            '#beeHive'      => $alert->inference?->beehive?->hive_name ?? $alert->inference?->beehive?->hive_id ?? '—',
            '#hiveLocation' => $alert->inference?->beehive?->hive_location ?? '—',
            '#beekeeper'    => $beekeeper->name,
            '#prediction'   => $alert->inference?->hive_state ?? '—',
            '#confidence'   => '—',
            '#alertMessage' => $advisory?->advisory_text ?? $alert->recommended_action ?? '—',
            '#timestamp'    => now()->format('Y-m-d H:i'),
        ]);

        try {
            $sms->send($beekeeper->phone, $message);
            $alert->update(['action_status' => 'sent']);

            return redirect()->route('alerts.index')
                ->with('success', "SMS sent to {$beekeeper->name} ({$beekeeper->phone}).");
        } catch (\Throwable $e) {
            return redirect()->route('alerts.index')
                ->with('error', "SMS failed: {$e->getMessage()}");
        }
    }
}
