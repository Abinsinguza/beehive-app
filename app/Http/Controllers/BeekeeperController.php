<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBeekeeperRequest;
use App\Http\Requests\UpdateBeekeeperRequest;
use App\Models\User;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class BeekeeperController extends Controller
{
    public function index()
    {
        $beekeepers = User::whereIn('role', ['farmer', 'farmer_revoked', 'farmer_pending'])
            ->withCount('beehives')
            ->latest('created_at')
            ->get();

        return Inertia::render('beekeepers', [
            'beekeepers' => $beekeepers,
        ]);
    }

    public function create()
    {
        //
    }

    public function store(StoreBeekeeperRequest $request)
    {
        $validated = $request->validated();

        try {
            $response = Http::timeout(15)->post(rtrim(config('services.ml_auth.base_url'), '/') . '/auth/register', [
                'full_name'  => $validated['full_name'],
                'email'      => $validated['email'],
                'password'   => $validated['password'],
                'phone'      => $validated['phone'],
                'address'    => $validated['address'] ?? null,
                'role'       => 'farmer',
                'server_url' => $validated['server_url'],
                'api_key'    => $validated['api_key'],
            ]);
        } catch (ConnectionException $e) {
            return redirect()->back()->withErrors(['email' => 'The ML server did not respond in time. It may be down — please try again shortly.']);
        }

        if (! $response->successful()) {
            return redirect()->back()->withErrors(['email' => $response->json('detail.0.msg') ?? 'Failed to register beekeeper on the ML server.']);
        }

        $accessToken = $response->json('access_token');
        $userId      = $response->json('user.user_id');

        if ($accessToken && $userId) {
            User::where('user_id', $userId)->update(['ml_access_token' => $accessToken]);
        }

        return redirect()->back()->with('success', 'Beekeeper added successfully');
    }

    public function show(User $beekeeper)
    {
        $beekeeper->loadCount('beehives');
        $beekeeper->load(['beehives' => function ($query) {
            $query->latest('created_at');
        }]);

        return Inertia::render('beekeeper-show', [
            'beekeeper' => $beekeeper,
        ]);
    }

    public function edit()
    {
        //
    }

    public function generateApiKey(Request $request)
    {
        $request->validate(['client_name' => ['required', 'string', 'max:150']]);

        $key = $this->requestApiKey($request->input('client_name'));

        if ($key instanceof \Illuminate\Http\RedirectResponse) {
            return $key;
        }

        return redirect()->back()->with('generated_api_key', $key);
    }

    public function regenerateApiKey(User $beekeeper)
    {
        $key = $this->requestApiKey($beekeeper->full_name);

        if ($key instanceof \Illuminate\Http\RedirectResponse) {
            return $key;
        }

        $beekeeper->update(['api_key' => $key]);

        return redirect()->back()->with('success', "New API key generated for {$beekeeper->full_name}.");
    }

    /**
     * Mint a fresh api_key from the ML server's admin endpoint. Returns the key string,
     * or a redirect response if the call failed.
     */
    private function requestApiKey(string $clientName): string|\Illuminate\Http\RedirectResponse
    {
        try {
            $response = Http::withHeaders(['x-admin-key' => config('services.ml_auth.admin_key')])
                ->timeout(15)
                ->post(rtrim(config('services.ml_auth.base_url'), '/') . '/admin/keys', [
                    'client_name' => $clientName,
                ]);
        } catch (ConnectionException $e) {
            return redirect()->back()->with('error', 'The ML server did not respond in time. It may be down — please try again shortly.');
        }

        if (! $response->successful()) {
            return redirect()->back()->with('error', $response->json('detail.0.msg') ?? 'Failed to generate API key.');
        }

        return $response->json();
    }

    public function storeHive(Request $request, User $beekeeper)
    {
        $validated = $request->validate([
            'hive_name'         => ['required', 'string', 'max:100'],
            'hive_location'     => ['required', 'string', 'max:150'],
            'hive_type'         => ['required', 'string', 'max:50'],
            'installation_date' => ['required', 'date'],
            'latitude'          => ['nullable', 'numeric', 'between:-90,90'],
            'longitude'         => ['nullable', 'numeric', 'between:-180,180'],
        ]);

        if (! $beekeeper->ml_access_token) {
            return redirect()->back()->withErrors(['hive_name' => 'This beekeeper has no ML server session. Re-register them to obtain one.']);
        }

        try {
            $response = Http::withToken($beekeeper->ml_access_token)
                ->timeout(15)
                ->post(rtrim(config('services.ml_auth.base_url'), '/') . '/hives', [
                    ...$validated,
                    'owner_id' => $beekeeper->id,
                ]);
        } catch (ConnectionException $e) {
            return redirect()->back()->withErrors(['hive_name' => 'The ML server did not respond in time. It may be down — please try again shortly.']);
        }

        if (! $response->successful()) {
            return redirect()->back()->withErrors(['hive_name' => $response->json('detail.0.msg') ?? 'Failed to register hive on the ML server.']);
        }

        if ($response->json('folder_created') === false) {
            return redirect()->back()->with('error', "Hive added, but its recordings folder could not be created: {$response->json('folder_creation_error')}. Use \"Create folder\" on the hive to retry.");
        }

        return redirect()->back()->with('success', 'Hive added successfully');
    }

    public function update(UpdateBeekeeperRequest $request, User $beekeeper)
    {
        $validated = $request->validated();

        $data = [
            'full_name' => $validated['full_name'],
            'email'     => $validated['email'] ?? null,
            'phone'     => $validated['phone'],
            'address'   => $validated['address'] ?? null,
        ];

        if (!empty($validated['password'])) {
            $data['password_hash'] = bcrypt($validated['password']);
        }

        $beekeeper->update($data);

        return redirect()->back()->with('success', 'Beekeeper updated successfully');
    }

    public function destroy(User $beekeeper)
    {
        $beekeeper->delete();

        return redirect()->back()->with('success', 'Beekeeper deleted successfully');
    }

    public function revoke(User $beekeeper)
    {
        $beekeeper->update(['role' => 'farmer_revoked']);

        return redirect()->back()->with('success', 'Beekeeper access revoked.');
    }

    public function restore(User $beekeeper)
    {
        $beekeeper->update(['role' => 'farmer']);

        return redirect()->back()->with('success', 'Beekeeper access restored.');
    }
}
