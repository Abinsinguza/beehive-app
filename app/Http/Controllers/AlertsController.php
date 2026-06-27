<?php

namespace App\Http\Controllers;

use App\Models\AdvisoryTemplate;
use App\Models\Alerts;
use App\Models\Beehive;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class AlertsController extends Controller
{
    public function index()
    {
        // viewed_at only exists on some database environments (e.g. bee_db) — guard before writing to it
        if (Schema::hasColumn('alerts', 'viewed_at')) {
            Alerts::whereNull('viewed_at')->update(['viewed_at' => now()]);
        }

        return Inertia::render('alerts', [
            'alerts'     => Alerts::with(['inference.beehive.owner'])
                                ->latest()
                                ->get(),
            'advisories' => AdvisoryTemplate::orderBy('prediction_code')
                                ->selectRaw("template_id AS id, hive_state AS condition_label, COALESCE(description, '') AS advisory_text, advisory_type, severity")
                                ->get(),
            'beehives'   => Beehive::with('owner')->get(),
        ]);
    }
}
