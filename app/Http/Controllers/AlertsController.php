<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class AlertsController extends Controller
{
    public function index()
    {
        $api = $this->api();

        return Inertia::render('alerts', [
            'alerts'            => $api->getAlerts(),
            'inferences'        => $api->getInferences(limit: 200),
            'advisoryTemplates' => $api->getAdvisoryTemplates(),
        ]);
    }

    /**
     * Mark an alert notification as dispatched (sent to farmer).
     */
    public function notify(Request $request, string $alertId)
    {
        $this->api()->notifyAlert($alertId);

        return redirect()->route('alerts.index');
    }

    /**
     * Mark an alert as acknowledged by the farmer.
     */
    public function acknowledge(Request $request, string $alertId)
    {
        $this->api()->acknowledgeAlert($alertId);

        return redirect()->route('alerts.index');
    }
}
