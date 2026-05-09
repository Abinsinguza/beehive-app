<?php

namespace App\Concerns;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;

trait ProfileValidationRules
{
    protected function profileRules(?string $userId = null): array
    {
        return [
            'name'  => $this->nameRules(),
            'email' => $this->emailRules($userId),
        ];
    }

    protected function nameRules(): array
    {
        return ['required', 'string', 'max:255'];
    }

    protected function emailRules(?string $userId = null): array
    {
        return [
            'required',
            'string',
            'email',
            'max:255',
            $userId === null
                ? Rule::unique(User::class, 'email')
                : Rule::unique(User::class, 'email')->ignore($userId, 'user_id'),
        ];
    }
}
