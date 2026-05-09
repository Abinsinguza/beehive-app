<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Models\User;
use App\Services\BsadsApiClient;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    /**
     * Validate and create a new admin user via FastAPI POST /auth/register,
     * then return the Eloquent User model that Fortify needs for the session.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            'name'     => ['required', 'string', 'max:100'],
            'email'    => ['required', 'email', 'max:255'],
            'password' => $this->passwordRules(),
        ])->validate();

        // Register via FastAPI so the DB row goes through the API layer.
        app(BsadsApiClient::class)->register([
            'full_name' => $input['name'],
            'email'     => $input['email'],
            'password'  => $input['password'],
            'role'      => 'admin',
        ]);

        // Fortify requires an Eloquent User object for the session.
        // The user was just created in the same DB, so this query is safe.
        return User::where('email', $input['email'])->firstOrFail();
    }
}
