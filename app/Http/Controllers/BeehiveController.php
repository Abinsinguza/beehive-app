<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBeehiveRequest;
use App\Http\Requests\UpdateBeehiveRequest;
use App\Models\Beehive;
use App\Models\Beekeeper;
use Inertia\Inertia;

class BeehiveController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $search = request('search', '');

        $beehives = Beehive::with('owner')
            ->when($search, function ($query, $search) {
                $query->where('id', 'like', "%{$search}%")
                      ->orWhere('hive_location', 'like', "%{$search}%")
                      ->orWhere('hive_type', 'like', "%{$search}%");
            })
            ->get();

        return inertia('beehives', [
            'beehives' => $beehives,
            'owners'   => Beekeeper::select('id', 'name')->get(),
            'search'   => $search,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
        return view('beehives.create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreBeehiveRequest $request)
    {
        $request->validate([
            'owner_id'      => ['required', 'string', 'exists:beekeepers,id'],
            'hive_location' => ['required', 'string', 'max:255'],
            'hive_type'     => ['required', 'string', 'max:255'],
            'current_state' => ['required', 'in:active,inactive,migrated,lost,abscondence,pest,uncertain'],
            'latitude'      => ['nullable', 'numeric', 'between:-90,90'],
            'longitude'     => ['nullable', 'numeric', 'between:-180,180'],
        ]);

        $last   = Beehive::orderBy('id', 'desc')->first();
        $number = $last ? ((int) substr($last->id, 2)) + 1 : 1;
        $newId  = 'BH' . str_pad($number, 4, '0', STR_PAD_LEFT);

        Beehive::create([
            'id'                => $newId,
            'owner_id'          => $request->owner_id,
            'hive_location'     => $request->hive_location,
            'hive_type'         => $request->hive_type,
            'installation_date' => now()->toDateString(),
            'current_state'     => $request->current_state,
            'latitude'          => $request->latitude,
            'longitude'         => $request->longitude,
        ]);

        return redirect()->back()->with('success', 'Hive added successfully');
    }

    /**
     * Display the specified resource.
     */
    public function show(Beehive $beehive)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Beehive $beehive)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateBeehiveRequest $request, Beehive $beehive)
    {
        $beehive->update($request->validate([
            'owner_id'          => 'required|string|exists:beekeepers,id',
            'hive_location'     => 'required|string|max:255',
            'hive_type'         => 'required|string|max:255',
            'installation_date' => 'required|date',
            'current_state'     => 'required|in:active,inactive,migrated,lost,abscondence,pest,uncertain',
            'latitude'          => 'nullable|numeric|between:-90,90',
            'longitude'         => 'nullable|numeric|between:-180,180',
        ]));

        return redirect()->back()->with('success', 'Hive updated successfully');
    }

    public function destroy(Beehive $beehive)
    {
        $beehive->delete();

        return redirect()->back()->with('success', 'Hive deleted successfully');
    }
}
