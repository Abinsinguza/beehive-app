<?php

namespace App\Http\Middleware;

use App\Models\Alert;
use App\Models\Beehive;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'flash' => [
                'success' => $request->session()->get('success'),
                'error'   => $request->session()->get('error'),
            ],
            // Global search data — shared on every page for the header search
            'searchData' => $request->user() ? [
                'beehives' => Beehive::select('id', 'hive_location', 'hive_type', 'current_state')->get(),
                'alerts'   => \App\Models\Alerts::with('advisory:id,condition_label')
                                ->select('id', 'alert_id', 'alert_type', 'advisory_id', 'alert_timestamp')
                                ->latest('alert_timestamp')
                                ->limit(50)
                                ->get(),
            ] : ['beehives' => [], 'alerts' => []],
        ];
    }
}
