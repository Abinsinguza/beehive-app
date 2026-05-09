<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class InferenceController extends Controller
{
    public function index()
    {
        $api = $this->api();

        return Inertia::render('inferences', [
            'inferences' => $api->getInferences(),
            'hives'      => collect($api->getHives())
                ->map(fn ($h) => ['hive_id' => $h['hive_id'], 'hive_location' => $h['hive_location']])
                ->values()
                ->all(),
        ]);
    }
}
