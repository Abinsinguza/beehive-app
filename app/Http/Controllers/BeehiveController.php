<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class BeehiveController extends Controller
{
    public function index()
    {
        $search = request('search', '');
        $api    = $this->api();

        return Inertia::render('beehives', [
            'beehives' => $api->getHives($search),
            'owners'   => collect($api->getUsers('farmer'))
                ->map(fn ($u) => ['id' => $u['user_id'], 'name' => $u['full_name']])
                ->values()
                ->all(),
            'search'   => $search,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'owner_id'      => ['nullable', 'string'],
            'hive_location' => ['required', 'string', 'max:150'],
            'hive_name'     => ['nullable', 'string', 'max:100'],
            'hive_type'     => ['nullable', 'string', 'max:50'],
            'current_state' => ['nullable', 'string'],
            'latitude'      => ['nullable', 'numeric'],
            'longitude'     => ['nullable', 'numeric'],
        ]);

        $this->api()->createHive(array_filter($data, fn ($v) => $v !== null));

        return redirect()->back()->with('success', 'Hive added successfully');
    }

    public function update(Request $request, string $hiveId)
    {
        $data = $request->validate([
            'owner_id'          => ['nullable', 'string'],
            'hive_location'     => ['nullable', 'string', 'max:150'],
            'hive_name'         => ['nullable', 'string', 'max:100'],
            'hive_type'         => ['nullable', 'string', 'max:50'],
            'installation_date' => ['nullable', 'date'],
            'current_state'     => ['nullable', 'string'],
            'latitude'          => ['nullable', 'numeric'],
            'longitude'         => ['nullable', 'numeric'],
        ]);

        $this->api()->updateHive($hiveId, array_filter($data, fn ($v) => $v !== null));

        return redirect()->back()->with('success', 'Hive updated successfully');
    }

    public function destroy(string $hiveId)
    {
        $this->api()->deleteHive($hiveId);

        return redirect()->back()->with('success', 'Hive deleted successfully');
    }
}
