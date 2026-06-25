<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBeekeeperRequest;
use App\Http\Requests\UpdateBeekeeperRequest;
use App\Models\User;
use App\Models\Beehive;
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

        // Generate a random API key for the new beekeeper
        $apiKey = $this->requestApiKey($validated['full_name']);

        User::create([
            'full_name' => $validated['full_name'],
            'email'     => $validated['email'] ?? null,
            'phone'     => $validated['phone'],
            'address'   => $validated['address'] ?? null,
            'password_hash' => bcrypt($validated['password']),
            'role'      => 'farmer',
            'server_url' => $validated['server_url'],
            'api_key'   => $apiKey,
        ]);

        return redirect()->back()->with('success', "Beekeeper added successfully with API key: {$apiKey}");
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
        return redirect()->back()->with('generated_api_key', $key);
    }

    public function regenerateApiKey(User $beekeeper)
    {
        $key = $this->requestApiKey($beekeeper->full_name);
        $beekeeper->update(['api_key' => $key]);
        return redirect()->back()->with('success', "New API key generated for {$beekeeper->full_name}: {$key}");
    }

    /**
     * Generate a random API key locally.
     */
    private function requestApiKey(string $clientName): string
    {
        // Generate a random API key (40 characters)
        return strtoupper(substr(str_shuffle(str_repeat('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 4)), 0, 40));
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

        // Create the hive locally first
        $beehive = Beehive::create([
            'owner_id'          => $beekeeper->id,
            'hive_name'         => $validated['hive_name'],
            'hive_location'     => $validated['hive_location'],
            'hive_type'         => $validated['hive_type'],
            'installation_date' => $validated['installation_date'],
            'latitude'          => $validated['latitude'] ?? null,
            'longitude'         => $validated['longitude'] ?? null,
            'current_state'     => 'unknown',
        ]);

        // Try to create the recordings folder on the ML server
        $folderCreated = false;
        $errorMessage = null;
        $apiKey = $beekeeper->api_key;
        $mlServerUrl = \Illuminate\Support\Facades\Session::get('ml_server_url') ?? config('services.ml_auth.base_url');

        if ($apiKey) {
            try {
                $response = Http::withHeaders(['x-api-key' => $apiKey])
                    ->timeout(15)
                    ->post(rtrim($mlServerUrl, '/') . "/recordings/hives/{$beehive->hive_name}");

                if ($response->successful()) {
                    $folderCreated = true;
                } else {
                    $errorMessage = $response->json('detail.0.msg') ?? 'Failed to create recordings folder.';
                }
            } catch (ConnectionException $e) {
                $errorMessage = 'The ML server did not respond in time. It may be down — please try again shortly.';
            }
        } else {
            $errorMessage = "This beekeeper has no API key configured.";
        }

        if (!$folderCreated) {
            return redirect()->back()->with('success', "Hive added successfully, but {$errorMessage} You can try again later from the hive details page.");
        }

        return redirect()->back()->with('success', 'Hive added successfully and recordings folder created.');
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

    public function assignToken(User $beekeeper)
    {
        $mlServerUrl = \Illuminate\Support\Facades\Session::get('ml_server_url');
        $mlAdminKey = \Illuminate\Support\Facades\Session::get('ml_admin_key');

        if (!$mlServerUrl || !$mlAdminKey) {
            return redirect()->back()->with('error', 'ML server not configured. Please set ML server URL and admin key in System Settings.');
        }

        try {
            $response = Http::withHeaders(['x-admin-key' => $mlAdminKey])
                ->timeout(15)
                ->post(rtrim($mlServerUrl, '/') . '/admin/keys', [
                    'client_name' => $beekeeper->full_name,
                ]);
        } catch (ConnectionException $e) {
            return redirect()->back()->with('error', 'The ML server did not respond in time. It may be down — please try again shortly.');
        }

        if (!$response->successful()) {
            return redirect()->back()->with('error', $response->json('detail.0.msg') ?? 'Failed to generate API key on ML server.');
        }

        $apiKey = $response->body();
        $beekeeper->update([
            'server_url' => $mlServerUrl,
            'api_key' => $apiKey,
        ]);

        return redirect()->back()->with('success', 'API token assigned to beekeeper successfully.');
    }
}
