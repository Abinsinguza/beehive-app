<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBeekeeperRequest;
use App\Http\Requests\UpdateBeekeeperRequest;
use App\Models\Beekeeper;
use Inertia\Inertia;

class BeekeeperController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
         $beekeepers = Beekeeper::all();
    return Inertia::render('beekeepers', [
        'beekeepers' => $beekeepers,
    ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return view('beekeepers.create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreBeekeeperRequest $request)
    {
        // Get last beekeeper
        $last = Beekeeper::orderBy('id', 'desc')->first();

        if ($last) {
            $number = (int) substr($last->id, 2); // remove BK
            $number++;
        } else {
            $number = 1;
        }

        $newId = 'BK' . str_pad($number, 4, '0', STR_PAD_LEFT);

        Beekeeper::create([
            'id' => $newId,
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'address' => $request->address,
            'password' => $request->password, // ⚠️ see note below
        ]);

        return redirect()->back()
            ->with('success', 'Beekeeper added successfully');
    }

    /**
     * Display the specified resource.
     */
    public function show(Beekeeper $beekeeper)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Beekeeper $beekeeper)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateBeekeeperRequest $request, Beekeeper $beekeeper)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Beekeeper $beekeeper)
    {
        //
    }
}
