<?php

namespace App\Http\Middleware;

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
        $user = $request->user();

        if ($user && !$user->device_token) {
            $user->forceFill(['device_token' => bin2hex(random_bytes(32))])->save();
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user'  => $user,
                'token' => $user?->device_token,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'flash' => [
                'success'           => $request->session()->get('success'),
                'error'             => $request->session()->get('error'),
                'generated_api_key' => $request->session()->get('generated_api_key'),
            ],
        ];
    }
}
