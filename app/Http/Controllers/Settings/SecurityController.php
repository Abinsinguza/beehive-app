<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\PasswordUpdateRequest;
use App\Http\Requests\Settings\TwoFactorAuthenticationRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Features;
use RuntimeException;

class SecurityController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return Features::canManageTwoFactorAuthentication()
            && Features::optionEnabled(Features::twoFactorAuthentication(), 'confirmPassword')
                ? [new Middleware('password.confirm', only: ['edit'])]
                : [];
    }

    public function edit(TwoFactorAuthenticationRequest $request): Response
    {
        $props = ['canManageTwoFactor' => Features::canManageTwoFactorAuthentication()];

        if (Features::canManageTwoFactorAuthentication()) {
            $request->ensureStateIsValid();
            $props['twoFactorEnabled']      = $request->user()->hasEnabledTwoFactorAuthentication();
            $props['requiresConfirmation']  = Features::optionEnabled(Features::twoFactorAuthentication(), 'confirm');
        }

        return Inertia::render('settings/security', $props);
    }

    /**
     * Change the admin's password via FastAPI PUT /auth/password.
     */
    public function update(PasswordUpdateRequest $request): RedirectResponse
    {
        try {
            $this->api()->changePassword(
                $request->current_password,
                $request->password,
            );
        } catch (RuntimeException $e) {
            // FastAPI returns 400 if current_password is wrong
            if (str_contains($e->getMessage(), '400')) {
                throw ValidationException::withMessages([
                    'current_password' => __('The provided password does not match your current password.'),
                ]);
            }
            throw $e;
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Password updated.')]);

        return back();
    }
}
