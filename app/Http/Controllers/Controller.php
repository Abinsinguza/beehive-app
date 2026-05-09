<?php

namespace App\Http\Controllers;

use App\Services\BsadsApiClient;

abstract class Controller
{
    /**
     * Return a BsadsApiClient pre-loaded with the admin JWT stored in session.
     */
    protected function api(): BsadsApiClient
    {
        $client = app(BsadsApiClient::class);
        $token  = session('api_token');

        return $token ? $client->withToken($token) : $client;
    }
}
