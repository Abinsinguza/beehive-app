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
        //
        return inertia('beehives', [
            // Load relationship
            'beehives' => Beehive::with('owner')->get(),

            // Pass beekeepers for dropdown
            'owners' => Beekeeper::select('id', 'name')->get(),
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
        //
        $last = Beehive::orderBy('id', 'desc')->first();
        if ($last) {
            $number = (int) substr($last->id, 2); // remove BH
            $number++;
        } else {
            $number = 1;
        }

        $newId = 'BH' . str_pad($number, 4, '0', STR_PAD_LEFT);

        Beehive::create([
            'id' => $newId,
            'owner_id' => $request->owner_id,
            'hive_location' => $request->hive_location,
            'hive_type' => $request->hive_type,
            'installation_date' => $request->installation_date,
            'current_state' => $request->current_state,
        ]);
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
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Beehive $beehive)
    {
        //
    }
}
